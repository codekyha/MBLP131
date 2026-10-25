#Requires -Version 5.1
<#
.SYNOPSIS
    Creates the MCMP117 / MBLP131 lab VM in VirtualBox on a lab machine.

.DESCRIPTION
    Source "Vdi" (default when MCMP117-Lab.vdi is present): creates a new VM, gives it its own copy of
    the prepared disk (new disk UUID, new MAC address) and starts it.
    Source "Ova": imports MCMP117-Lab.ova instead (new MAC addresses are generated on import).
    Both sources are verified against their .sha256 file when it is present.

    Every copy generates its own SSH host keys, machine-id and hostname (lab-xxxx) on first boot.
    Default network: NAT with host port 2222 forwarded to guest SSH (ssh -p 2222 user@127.0.0.1).
    Use -BridgeAdapter to place the VM on the lab LAN instead (list names with -ListAdapters).

    After starting the VM the script waits (up to -WaitSeconds, default 150) until the guest answers
    (sshd banner on the forwarded port, or the guest IP address when bridged) and reports it. No login is
    attempted. Use -NoWait to skip this check. -Force replaces an existing VM of the same name.

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Deploy-LabVM.ps1

.EXAMPLE
    .\Deploy-LabVM.ps1 -ListAdapters
    .\Deploy-LabVM.ps1 -BridgeAdapter "Intel(R) Ethernet Connection I219-LM" -MemoryMB 4096
#>
[CmdletBinding()]
param(
    [ValidateSet('Auto', 'Vdi', 'Ova')][string]$Source = 'Auto',
    [string]$VdiPath = '',
    [string]$OvaPath = '',
    [string]$VMName = ('MCMP117-Lab-' + $env:COMPUTERNAME),
    [string]$VMFolder = '',
    [int]$MemoryMB = 2048,
    [int]$Cpus = 2,
    [int]$SshPort = 2222,
    [string]$BridgeAdapter = '',
    [switch]$ListAdapters,
    [switch]$Headless,
    [switch]$NoStart,
    [switch]$NoWait,
    [int]$WaitSeconds = 150,
    [switch]$Force,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot can be empty while default parameter values are evaluated (seen with Windows PowerShell 5.1
# started through the .cmd launcher), so the script folder is resolved explicitly with fallbacks.
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir -and $MyInvocation.MyCommand.Path) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
if (-not $VdiPath) { $VdiPath = Join-Path $ScriptDir 'MCMP117-Lab.vdi' }
if (-not $OvaPath) { $OvaPath = Join-Path $ScriptDir 'MCMP117-Lab.ova' }

function Exit-Script([int]$Code) {
    if (-not $NoPause -and [Environment]::UserInteractive) {
        try { Read-Host 'Press Enter to close this window' | Out-Null } catch { }
    }
    exit $Code
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

# Reads the first line the guest's sshd sends (its version banner). No login is attempted.
function Get-SshBanner([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne(2000)) { return $null }
        $client.EndConnect($iar)
        $stream = $client.GetStream()
        $stream.ReadTimeout = 3000
        $buf = New-Object byte[] 256
        $n = $stream.Read($buf, 0, $buf.Length)
        if ($n -gt 0) { return ([Text.Encoding]::ASCII.GetString($buf, 0, $n) -split "`r?`n")[0].Trim() }
    } catch {
    } finally {
        $client.Close()
    }
    return $null
}

# Value of a guest property published by the VirtualBox guest utilities inside the VM (or $null).
function Get-GuestProperty([string]$Name, [string]$Property) {
    try {
        foreach ($l in @(Vbm guestproperty get $Name $Property)) {
            if ($l -match '^Value:\s*(.+)$') { return $Matches[1].Trim() }
        }
    } catch { }
    return $null
}

function Test-Checksum([string]$Path) {
    $sidecar = $Path + '.sha256'
    if (-not (Test-Path -LiteralPath $sidecar)) {
        Write-Warning "No $sidecar found; checksum not verified."
        return
    }
    Write-Host ('Verifying checksum of {0} ...' -f (Split-Path $Path -Leaf))
    $expected = ((Get-Content -LiteralPath $sidecar -TotalCount 1) -split '\s+')[0].ToLower()
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLower()
    if ($expected -ne $actual) { throw "Checksum mismatch for $Path (the file is corrupt or incomplete)." }
    Write-Host '  OK'
}

try {
    $script:VBoxManage = Find-VBoxManage

    if ($ListAdapters) {
        Write-Host 'Host network adapters usable with -BridgeAdapter:'
        foreach ($l in @(Vbm list bridgedifs)) {
            if ($l -match '^Name:\s+(.+)$') { Write-Host ('  ' + $Matches[1].Trim()) }
        }
        Exit-Script 0
    }

    # ---- choose the source ----------------------------------------------------------
    $useVdi = $false
    if ($Source -eq 'Vdi') {
        $useVdi = $true
    } elseif ($Source -eq 'Auto') {
        $useVdi = Test-Path -LiteralPath $VdiPath
    }
    if ($useVdi) {
        if (-not (Test-Path -LiteralPath $VdiPath)) { throw "VDI not found: $VdiPath" }
    } else {
        if (-not (Test-Path -LiteralPath $OvaPath)) { throw "Neither a VDI ($VdiPath) nor an OVA ($OvaPath) was found." }
    }

    if (Test-VmRegistered $VMName) {
        if (-not $Force) { throw "A VM named '$VMName' already exists. Use -Force to replace it or -VMName to choose another name." }
        Write-Host "Removing existing VM '$VMName' ..."
        try { Vbm controlvm $VMName poweroff | Out-Null; Start-Sleep -Seconds 3 } catch { }
        Vbm unregistervm $VMName --delete | Out-Null
    }

    if ($useVdi) {
        Test-Checksum $VdiPath

        $cfg = @{ firmware = 'bios'; ostype = 'Ubuntu_64' }
        $cfgPath = Join-Path (Split-Path -Parent $VdiPath) 'MCMP117-Lab.config'
        if (Test-Path -LiteralPath $cfgPath) {
            # key=value pairs, normally one per line (pairs separated by spaces on one line are accepted too)
            foreach ($m in [regex]::Matches((Get-Content -LiteralPath $cfgPath -Raw), '(?<k>\w+)=(?<v>\S+)')) {
                $cfg[$m.Groups['k'].Value] = $m.Groups['v'].Value
            }
        } else {
            Write-Warning "No $cfgPath found; assuming BIOS firmware."
        }
        if ($cfg['firmware'] -ne 'efi') { $cfg['firmware'] = 'bios' }

        Write-Host "Creating VM '$VMName' from the VDI ..."
        $createArgs = @('createvm', '--name', $VMName, '--ostype', $cfg['ostype'], '--register')
        if ($VMFolder) { $createArgs += @('--basefolder', $VMFolder) }
        Vbm @createArgs | Out-Null

        $info = Get-VmInfo $VMName
        $vmDir = Split-Path -Parent $info['CfgFile']

        Vbm modifyvm $VMName --memory ([string]$MemoryMB) --cpus ([string]$Cpus) --firmware $cfg['firmware'] --ioapic on --rtcuseutc on --graphicscontroller vboxsvga --vram 16 --boot1 disk --boot2 none --boot3 none --boot4 none | Out-Null
        Vbm storagectl $VMName --name 'SATA' --add sata --controller IntelAhci --portcount 1 --bootable on | Out-Null

        $diskCopy = Join-Path $vmDir ($VMName + '.vdi')
        Write-Host '  Copying the disk (about a minute) ...'
        Vbm clonemedium disk $VdiPath $diskCopy --format VDI --variant Standard | Out-Null
        try { Vbm closemedium disk $VdiPath | Out-Null } catch { }
        Vbm storageattach $VMName --storagectl 'SATA' --port 0 --device 0 --type hdd --medium $diskCopy | Out-Null
    } else {
        Test-Checksum $OvaPath
        Write-Host "Importing '$VMName' from the OVA (about a minute) ..."
        Vbm import $OvaPath --vsys 0 --vmname $VMName --cpus ([string]$Cpus) --memory ([string]$MemoryMB) | Out-Null
    }

    if ($BridgeAdapter) {
        Vbm modifyvm $VMName --nic1 bridged --bridgeadapter1 $BridgeAdapter | Out-Null
        $access = 'Bridged to the lab LAN: find the address on the VM console with "ip -br a", then ssh user@<address>.'
    } else {
        Vbm modifyvm $VMName --nic1 nat | Out-Null
        try { Vbm modifyvm $VMName --natpf1 delete ssh | Out-Null } catch { }
        Vbm modifyvm $VMName --natpf1 "ssh,tcp,,$SshPort,,22" | Out-Null
        $access = "NAT: ssh -p $SshPort user@127.0.0.1"
    }

    Write-Host ''
    Write-Host "VM '$VMName' is ready." -ForegroundColor Green
    Write-Host '  Login   : user / 1234  (change it with: passwd)'
    Write-Host "  Network : $access"

    if (-not $NoStart) {
        $type = 'gui'
        if ($Headless) { $type = 'headless' }
        Vbm startvm $VMName --type $type | Out-Null
        Write-Host '  Started (the first boot takes about 30 seconds longer than later boots).'

        if (-not $NoWait) {
            # Smoke test without logging in: the guest must get an address and its sshd must answer.
            Write-Host "  Waiting for the guest to come up (up to $WaitSeconds s) ..."
            $deadline = (Get-Date).AddSeconds($WaitSeconds)
            $banner = $null
            $ip = $null
            while ((Get-Date) -lt $deadline) {
                Start-Sleep -Seconds 5
                $ip = Get-GuestProperty $VMName '/VirtualBox/GuestInfo/Net/0/V4/IP'
                if (-not $BridgeAdapter) { $banner = Get-SshBanner $SshPort }
                if ($banner -or ($BridgeAdapter -and $ip)) { break }
            }
            if ($banner) {
                Write-Host "  Guest is up and sshd answers on port ${SshPort}: $banner" -ForegroundColor Green
            } elseif ($ip) {
                Write-Host "  Guest is up with IPv4 address ${ip}: ssh user@$ip" -ForegroundColor Green
            } else {
                Write-Warning 'No answer from the guest yet; it may still be booting. Look at the VM window.'
            }
        }
    }
    Exit-Script 0
}
catch {
    Write-Host ''
    Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
    Exit-Script 1
}
