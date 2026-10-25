#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the MCMP117 / MBLP131 lab base VM and exports it as a VDI disk (and an OVA).

.DESCRIPTION
    1. Downloads the official Ubuntu cloud-image OVA (default: 24.04 "noble") and verifies its SHA-256.
    2. Renders seed\user-data.template (embedding lab_install.sh and, when present,
       mcmp117_lab_setup.sh) into a cloud-init "cidata" seed ISO.
    3. Imports the OVA into VirtualBox (disk as VDI), enlarges the disk, attaches the seed ISO
       and boots the VM headless.
    4. cloud-init installs the lab software, prepares the image for cloning and powers the VM off.
    5. Detaches the seed, exports MCMP117-Lab.vdi (+ .sha256, .config) and MCMP117-Lab.ova (+ .sha256)
       and removes the temporary VM.

    Needs Oracle VirtualBox 6.1 or later (VBoxManage). Internet access is needed on the build
    machine only; the resulting VDI and OVA are self-contained.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-LabVM.ps1

.EXAMPLE
    .\Build-LabVM.ps1 -ShowGui -DiskGB 30 -LabSetupScript D:\MCMP117\_build\mcmp117_lab_setup.sh
#>
[CmdletBinding()]
param(
    [string]$VMName = 'MCMP117-Lab-Base',
    [string]$Series = 'noble',
    [int]$MemoryMB = 2048,
    [int]$Cpus = 2,
    [int]$DiskGB = 20,
    [int]$SshPort = 2222,
    [string]$OutputOva = '',
    [string]$OutputVdi = '',
    [string]$WorkDir = (Join-Path $env:LOCALAPPDATA 'MCMP117-LabBuild'),
    [string]$LabSetupScript = '',
    [int]$TimeoutMinutes = 60,
    [switch]$ShowGui,
    [switch]$NoOva,
    [switch]$NoPause,
    [switch]$UsePrebuiltSeed,
    [switch]$KeepVM,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot can be empty while default parameter values are evaluated (seen with Windows PowerShell 5.1
# started through the .cmd launcher), so the script folder is resolved explicitly with fallbacks.
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir -and $MyInvocation.MyCommand.Path) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
if (-not $OutputOva) { $OutputOva = Join-Path $ScriptDir 'MCMP117-Lab.ova' }
if (-not $OutputVdi) { $OutputVdi = Join-Path $ScriptDir 'MCMP117-Lab.vdi' }
if (-not $LabSetupScript) { $LabSetupScript = Join-Path $ScriptDir 'mcmp117_lab_setup.sh' }

# Progress is also written to Build-LabVM.log next to the script.
try { Start-Transcript -LiteralPath (Join-Path $ScriptDir 'Build-LabVM.log') -Force | Out-Null } catch { }

function Exit-Script([int]$Code) {
    try { Stop-Transcript | Out-Null } catch { }
    if (-not $NoPause -and [Environment]::UserInteractive) {
        try { Read-Host 'Press Enter to close this window' | Out-Null } catch { }
    }
    exit $Code
}

# ----------------------------------------------------------------------------- helpers

function Write-Step([string]$Message) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Find-VBoxManage {
    $cmd = Get-Command VBoxManage.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @()
    if ($env:VBOX_MSI_INSTALL_PATH) { $candidates += (Join-Path $env:VBOX_MSI_INSTALL_PATH 'VBoxManage.exe') }
    $candidates += (Join-Path $env:ProgramFiles 'Oracle\VirtualBox\VBoxManage.exe')
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) { return $c }
    }
    throw 'VBoxManage.exe not found. Install Oracle VirtualBox (winget install Oracle.VirtualBox) or add it to PATH.'
}

# Runs VBoxManage, returns its output lines, throws on a non-zero exit code.
function Vbm {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'   # native stderr must not become a terminating error
    try {
        $out = & $script:VBoxManage @args 2>&1 | ForEach-Object { [string]$_ }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($code -ne 0) {
        throw ("VBoxManage {0} failed with exit code {1}:{2}{3}" -f ($args -join ' '), $code, [Environment]::NewLine, ($out -join [Environment]::NewLine))
    }
    return $out
}

function Get-VmInfo([string]$Name) {
    $info = @{}
    foreach ($line in @(Vbm showvminfo $Name --machinereadable)) {
        if ($line -match '^"?(?<k>[^"=]+)"?=(?<v>.*)$') {
            $key = $Matches['k']
            $v = $Matches['v'].Trim()
            if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
            $info[$key] = $v.Replace('\\', '\')
        }
    }
    return $info
}

function Test-VmRegistered([string]$Name) {
    $pattern = '^"' + [regex]::Escape($Name) + '" \{'
    foreach ($l in @(Vbm list vms)) {
        if ($l -match $pattern) { return $true }
    }
    return $false
}

function Remove-LabVm([string]$Name) {
    $state = ''
    try { $state = (Get-VmInfo $Name)['VMState'] } catch { }
    if ($state -and $state -ne 'poweroff' -and $state -ne 'aborted' -and $state -ne 'saved') {
        try { Vbm controlvm $Name poweroff | Out-Null; Start-Sleep -Seconds 3 } catch { }
    }
    Vbm unregistervm $Name --delete | Out-Null
}

function Get-DiskAttachment($Info) {
    foreach ($k in $Info.Keys) {
        if ($k -match '^(?<ctl>.+)-(?<port>\d+)-(?<dev>\d+)$') {
            $ctl = $Matches['ctl']; $port = [int]$Matches['port']; $dev = [int]$Matches['dev']
            if ($Info[$k] -match '\.(vdi|vmdk)$') {
                return [pscustomobject]@{ Controller = $ctl; Port = $port; Device = $dev; Path = $Info[$k] }
            }
        }
    }
    return $null
}

function Get-StorageControllers($Info) {
    $list = @()
    foreach ($k in $Info.Keys) {
        if ($k -match '^storagecontrollername(?<i>\d+)$') {
            $i = $Matches['i']
            $list += [pscustomobject]@{ Name = $Info[$k]; Type = $Info["storagecontrollertype$i"] }
        }
    }
    return $list
}

function Get-RemoteFile([string]$Url, [string]$Destination) {
    Write-Host "  GET $Url"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    try {
        Start-BitsTransfer -Source $Url -Destination $Destination -ErrorAction Stop
    } catch {
        Write-Warning ("BITS transfer failed ({0}); falling back to WebClient." -f $_.Exception.Message)
        $wc = New-Object System.Net.WebClient
        try { $wc.DownloadFile($Url, $Destination) } finally { $wc.Dispose() }
    }
}

function ConvertTo-Lf([string]$Text) { return $Text.Replace("`r`n", "`n") }

function Get-Base64OfScript([string]$Path) {
    $text = ConvertTo-Lf ([IO.File]::ReadAllText($Path))
    return [Convert]::ToBase64String((New-Object System.Text.UTF8Encoding($false)).GetBytes($text))
}

# Fills seed\user-data.template and writes user-data + meta-data (UTF-8, no BOM, LF) into OutDir.
function New-SeedFiles([string]$TemplateDir, [string]$InstallScript, [string]$SetupScript, [string]$OutDir) {
    if (Test-Path -LiteralPath $OutDir) { Remove-Item -LiteralPath $OutDir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    $utf8 = New-Object System.Text.UTF8Encoding($false)

    $template = ConvertTo-Lf ([IO.File]::ReadAllText((Join-Path $TemplateDir 'user-data.template')))
    $entry = ''
    if ($SetupScript -and (Test-Path -LiteralPath $SetupScript)) {
        $entry = "  - path: /opt/lab/mcmp117_lab_setup.sh`n    owner: root:root`n    permissions: '0755'`n    encoding: b64`n    content: " + (Get-Base64OfScript $SetupScript)
    }
    $verifyScript = Join-Path (Split-Path -Parent $InstallScript) 'verify_lab.sh'
    $userData = $template.Replace('@@LAB_INSTALL_B64@@', (Get-Base64OfScript $InstallScript)).Replace('@@VERIFY_LAB_B64@@', (Get-Base64OfScript $verifyScript)).Replace('@@LAB_SETUP_ENTRY@@', $entry)
    [IO.File]::WriteAllText((Join-Path $OutDir 'user-data'), $userData, $utf8)

    $meta = ConvertTo-Lf ([IO.File]::ReadAllText((Join-Path $TemplateDir 'meta-data')))
    [IO.File]::WriteAllText((Join-Path $OutDir 'meta-data'), $meta, $utf8)
}

# Builds an ISO 9660 + Joliet image labelled "cidata" with the Windows IMAPI2 COM API.
function New-SeedIso([string]$SourceDir, [string]$IsoPath) {
    if (-not ('LabIsoWriter' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public static class LabIsoWriter
{
    public static void Write(object stream, string path, int blockSize, int totalBlocks)
    {
        IStream src = (IStream)stream;
        byte[] buf = new byte[blockSize];
        IntPtr cb = Marshal.AllocHGlobal(4);
        try
        {
            using (FileStream fs = File.Open(path, FileMode.Create, FileAccess.Write))
            {
                for (int i = 0; i < totalBlocks; i++)
                {
                    src.Read(buf, blockSize, cb);
                    int n = Marshal.ReadInt32(cb);
                    fs.Write(buf, 0, n);
                }
            }
        }
        finally { Marshal.FreeHGlobal(cb); }
    }
}
'@
    }
    $fsi = New-Object -ComObject IMAPI2FS.MsftFileSystemImage
    $fsi.FileSystemsToCreate = 3          # 1 = ISO 9660, 2 = Joliet
    $fsi.VolumeName = 'cidata'
    $fsi.Root.AddTree($SourceDir, $false)
    $result = $fsi.CreateResultImage()
    [LabIsoWriter]::Write($result.ImageStream, $IsoPath, $result.BlockSize, $result.TotalBlocks)
    if (-not (Test-Path -LiteralPath $IsoPath) -or (Get-Item -LiteralPath $IsoPath).Length -lt 2048) {
        throw 'IMAPI2 produced an empty ISO.'
    }
}

# ----------------------------------------------------------------------------- main

$vmCreated = $false
try {
    # The course lab-folder generator: this folder first, then the sibling _build folder (MBLP131\_build).
    if (-not (Test-Path -LiteralPath $LabSetupScript)) {
        $sibling = Join-Path $ScriptDir '..\_build\mcmp117_lab_setup.sh'
        if (Test-Path -LiteralPath $sibling) { $LabSetupScript = (Resolve-Path -LiteralPath $sibling).Path }
    }
    $installScript = Join-Path $ScriptDir 'lab_install.sh'
    $templateDir = Join-Path $ScriptDir 'seed'
    foreach ($req in @($installScript, (Join-Path $ScriptDir 'verify_lab.sh'), (Join-Path $templateDir 'user-data.template'), (Join-Path $templateDir 'meta-data'))) {
        if (-not (Test-Path -LiteralPath $req)) { throw "Missing kit file: $req" }
    }

    Write-Step 'Checking prerequisites'
    $script:VBoxManage = Find-VBoxManage
    $vboxVersion = (@(Vbm --version))[0]
    Write-Host "  VBoxManage : $script:VBoxManage"
    Write-Host "  VirtualBox : $vboxVersion"
    if ([int](($vboxVersion -split '\.')[0]) -lt 6) { throw 'VirtualBox 6.1 or later is required.' }

    New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
    $drive = New-Object System.IO.DriveInfo ([IO.Path]::GetPathRoot($WorkDir))
    $freeGB = [math]::Round($drive.AvailableFreeSpace / 1GB, 1)
    Write-Host "  Work dir   : $WorkDir  ($freeGB GB free)"
    if ($freeGB -lt ($DiskGB + 4)) { Write-Warning "Less than $($DiskGB + 4) GB free on the work drive; the build may fail." }

    if (Test-VmRegistered $VMName) {
        if (-not $Force) { throw "A VM named '$VMName' already exists. Re-run with -Force to replace it." }
        Write-Host "  Removing existing VM '$VMName'"
        Remove-LabVm $VMName
    }

    # ---- 1. download ---------------------------------------------------------------
    Write-Step "Fetching Ubuntu $Series cloud image (OVA)"
    $baseUrl = "https://cloud-images.ubuntu.com/$Series/current"
    $ovaName = "$Series-server-cloudimg-amd64.ova"
    $ovaPath = Join-Path $WorkDir $ovaName
    $sumsPath = Join-Path $WorkDir 'SHA256SUMS'
    if (Test-Path -LiteralPath $sumsPath) { Remove-Item -LiteralPath $sumsPath -Force }
    Get-RemoteFile "$baseUrl/SHA256SUMS" $sumsPath

    $expected = $null
    foreach ($l in (Get-Content -LiteralPath $sumsPath)) {
        if ($l -match '^(?<h>[0-9a-fA-F]{64})\s+\*?(?<f>\S+)$' -and $Matches['f'] -eq $ovaName) { $expected = $Matches['h'].ToLower() }
    }
    if (-not $expected) { Write-Warning "$ovaName is not listed in SHA256SUMS; integrity check skipped (download is HTTPS)." }

    $needDownload = $true
    if (Test-Path -LiteralPath $ovaPath) {
        if ($expected -and ((Get-FileHash -Algorithm SHA256 -LiteralPath $ovaPath).Hash.ToLower() -eq $expected)) {
            Write-Host '  Cached OVA matches the published checksum; reusing it.'
            $needDownload = $false
        } else {
            Remove-Item -LiteralPath $ovaPath -Force
        }
    }
    if ($needDownload) {
        Get-RemoteFile "$baseUrl/$ovaName" $ovaPath
        if ($expected) {
            $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $ovaPath).Hash.ToLower()
            if ($actual -ne $expected) {
                Remove-Item -LiteralPath $ovaPath -Force
                throw "SHA-256 mismatch for $ovaName (expected $expected, got $actual). Canonical may have republished the image during the download; run the script again."
            }
            Write-Host '  SHA-256 verified.'
        }
    }

    # ---- 2. seed ISO ----------------------------------------------------------------
    Write-Step 'Preparing cloud-init seed ISO'
    $seedDir = Join-Path $WorkDir 'seed'
    $seedIso = Join-Path $WorkDir 'lab-seed.iso'
    $prebuilt = Join-Path $ScriptDir 'lab-seed.iso'
    $seedReady = $false
    if (-not $UsePrebuiltSeed) {
        try {
            New-SeedFiles $templateDir $installScript $LabSetupScript $seedDir
            if (Test-Path -LiteralPath $seedIso) { Remove-Item -LiteralPath $seedIso -Force }
            New-SeedIso $seedDir $seedIso
            $seedReady = $true
            if (Test-Path -LiteralPath $LabSetupScript) {
                Write-Host "  Embedded course lab script: $LabSetupScript"
            } else {
                Write-Warning "mcmp117_lab_setup.sh not found ($LabSetupScript); the image will not contain the course lab folder."
            }
        } catch {
            Write-Warning ("Could not build the seed ISO ({0})." -f $_.Exception.Message)
        }
    }
    if (-not $seedReady) {
        if (-not (Test-Path -LiteralPath $prebuilt)) { throw 'No seed ISO available (build failed and lab-seed.iso is missing).' }
        Copy-Item -LiteralPath $prebuilt -Destination $seedIso -Force
        Write-Warning 'Using the prebuilt lab-seed.iso (it does not contain mcmp117_lab_setup.sh and ignores edits made after it was generated).'
    }

    # ---- 3. import and configure ------------------------------------------------------
    Write-Step "Importing the OVA as '$VMName' (this takes a few minutes)"
    $vmBase = Join-Path $WorkDir 'vms'
    New-Item -ItemType Directory -Force -Path $vmBase | Out-Null
    Vbm import $ovaPath --options importtovdi --vsys 0 --vmname $VMName --basefolder $vmBase --cpus $Cpus --memory $MemoryMB | Out-Null
    $vmCreated = $true

    $info = Get-VmInfo $VMName
    $disk = Get-DiskAttachment $info
    if (-not $disk) { throw 'Could not locate the imported system disk.' }
    $capacityText = (@(Vbm showmediuminfo disk $disk.Path)) -join "`n"
    $currentMB = 0
    if ($capacityText -match 'Capacity:\s+(\d+)\s+MBytes') { $currentMB = [int64]$Matches[1] }
    $targetMB = [int64]$DiskGB * 1024
    if ($currentMB -lt $targetMB) {
        Write-Host "  Enlarging disk: $currentMB MB -> $targetMB MB (cloud-init grows the file system on first boot)"
        Vbm modifymedium disk $disk.Path --resize ([string]$targetMB) | Out-Null
    } else {
        Write-Host "  Disk already $currentMB MB; no resize needed."
    }

    Vbm modifyvm $VMName --nic1 nat --natpf1 "ssh,tcp,,$SshPort,,22" --boot1 disk --boot2 dvd --boot3 none --boot4 none | Out-Null
    try { Vbm modifyvm $VMName --uart1 off | Out-Null } catch { Write-Warning 'Could not disable the serial port (continuing).' }

    # attach the seed ISO: reuse an existing AHCI controller, otherwise add one
    $info = Get-VmInfo $VMName
    $ahci = @(Get-StorageControllers $info) | Where-Object { $_.Type -eq 'IntelAhci' } | Select-Object -First 1
    $addedController = $false
    if ($ahci) {
        $ctlName = $ahci.Name
        $ports = 0..29
    } else {
        $ctlName = 'LabSeedSATA'
        Vbm storagectl $VMName --name $ctlName --add sata --controller IntelAhci --portcount 2 | Out-Null
        $addedController = $true
        $ports = 0..1
    }
    $seedPort = -1
    foreach ($p in $ports) {
        try {
            Vbm storageattach $VMName --storagectl $ctlName --port ([string]$p) --device 0 --type dvddrive --medium $seedIso | Out-Null
            $seedPort = $p
            break
        } catch { }
    }
    if ($seedPort -lt 0) { throw 'Could not attach the seed ISO to any free storage port.' }

    # ---- 4. first boot = provisioning ---------------------------------------------------
    Write-Step 'Booting the VM: cloud-init installs the lab software, then powers the VM off'
    Write-Host "  Expect roughly 10-25 minutes depending on the connection. Timeout: $TimeoutMinutes min."
    if (-not $ShowGui) { Write-Host '  (headless; use -ShowGui to watch the console)' }
    $startType = 'headless'
    if ($ShowGui) { $startType = 'gui' }
    Vbm startvm $VMName --type $startType | Out-Null

    $started = Get-Date
    $deadline = $started.AddMinutes($TimeoutMinutes)
    $state = ''
    while ($true) {
        Start-Sleep -Seconds 15
        $state = (Get-VmInfo $VMName)['VMState']
        $elapsed = (Get-Date) - $started
        Write-Host ('  [{0}] VM state: {1}' -f $elapsed.ToString('hh\:mm\:ss'), $state)
        if ($state -eq 'poweroff' -or $state -eq 'aborted') { break }
        if ((Get-Date) -gt $deadline) {
            throw ("The VM did not power off within $TimeoutMinutes minutes, which means provisioning did not finish. " +
                   "Re-run with -ShowGui -Force to watch the console, or log in (user/1234) and read /var/log/lab_firstboot.log and /var/log/cloud-init-output.log.")
        }
    }
    if ($state -ne 'poweroff') { throw "The VM stopped unexpectedly (state '$state')." }
    Write-Host '  Provisioning finished (the VM only powers off after lab_install.sh and finalize.sh succeeded).'

    # ---- 5. clean up and export -----------------------------------------------------------
    Write-Step 'Preparing the VM for export'
    try {
        if ($addedController) {
            Vbm storagectl $VMName --name $ctlName --remove | Out-Null
        } else {
            Vbm storageattach $VMName --storagectl $ctlName --port ([string]$seedPort) --device 0 --type dvddrive --medium emptydrive | Out-Null
        }
    } catch { Write-Warning ("Could not detach the seed ISO cleanly: {0}" -f $_.Exception.Message) }
    try { Vbm modifyvm $VMName --natpf1 delete ssh | Out-Null } catch { }

    $finalInfo = Get-VmInfo $VMName
    $firmware = 'bios'
    if ($finalInfo['firmware'] -match 'EFI') { $firmware = 'efi' }

    Write-Step "Exporting the standalone disk $OutputVdi"
    if (Test-Path -LiteralPath $OutputVdi) { Remove-Item -LiteralPath $OutputVdi -Force }
    Vbm clonemedium disk $disk.Path $OutputVdi --format VDI --variant Standard | Out-Null
    try { Vbm closemedium disk $OutputVdi | Out-Null } catch { }
    $vdiHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $OutputVdi).Hash.ToLower()
    Set-Content -LiteralPath ($OutputVdi + '.sha256') -Value ('{0}  {1}' -f $vdiHash, (Split-Path $OutputVdi -Leaf)) -Encoding ASCII
    $vdiSizeMB = [math]::Round((Get-Item -LiteralPath $OutputVdi).Length / 1MB)
    $configPath = Join-Path (Split-Path -Parent $OutputVdi) 'MCMP117-Lab.config'
    # One key=value pair per line. (Beware: in PowerShell the comma binds tighter than '+', so the elements
    # must be parenthesised or the whole array is glued onto the first string.)
    $configLines = @(
        ('firmware=' + $firmware),
        'ostype=Ubuntu_64',
        ('built=' + (Get-Date -Format 'yyyy-MM-dd'))
    )
    Set-Content -LiteralPath $configPath -Value $configLines -Encoding ASCII

    $ovaSummary = 'not exported (-NoOva)'
    if (-not $NoOva) {
        Write-Step "Exporting $OutputOva"
        if (Test-Path -LiteralPath $OutputOva) { Remove-Item -LiteralPath $OutputOva -Force }
        Vbm export $VMName -o $OutputOva | Out-Null
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $OutputOva).Hash.ToLower()
        Set-Content -LiteralPath ($OutputOva + '.sha256') -Value ('{0}  {1}' -f $hash, (Split-Path $OutputOva -Leaf)) -Encoding ASCII
        $ovaSummary = ('{0} ({1} MB)' -f $OutputOva, [math]::Round((Get-Item -LiteralPath $OutputOva).Length / 1MB))
    }

    if ($KeepVM) {
        Write-Host "  Keeping the build VM '$VMName' (-KeepVM)."
    } else {
        Remove-LabVm $VMName
        $vmCreated = $false
    }

    Write-Host ''
    Write-Host 'Build finished.' -ForegroundColor Green
    Write-Host "  VDI    : $OutputVdi ($vdiSizeMB MB)"
    Write-Host "  OVA    : $ovaSummary"
    Write-Host "  Config : $configPath (firmware $firmware)"
    Write-Host '  Next   : copy this folder to each lab machine and run Deploy-LabVM.cmd (or Deploy-LabVM.ps1).'
    Write-Host '           Log in with user / 1234 and run "verify_lab" once on a test machine.'
    Exit-Script 0
}
catch {
    Write-Host ''
    Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
    if ($vmCreated -and -not $KeepVM) {
        Write-Host "The partly built VM '$VMName' was left registered for inspection; remove it with -Force on the next run." -ForegroundColor Yellow
    }
    Exit-Script 1
}
