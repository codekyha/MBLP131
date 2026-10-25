#Requires -Version 5.1
<#
.SYNOPSIS
    Installs "Ubuntu Lab": Ubuntu 24.04 on WSL 2 with the software of the lab kit, and a desktop shortcut.

.DESCRIPTION
    For a Windows 10 (version 2004 or later) or Windows 11 computer that should run the MBBO205 (cloud computing and
    AI) and MCMP117 / MBLP131 (Linux and Bash) labs without a virtual machine.

    1. Checks WSL 2. With -InstallWsl it also installs WSL when it is missing (that part needs administrator
       rights and a restart of Windows).
    2. Downloads the official Ubuntu 24.04 WSL image from releases.ubuntu.com, verifies its SHA-256 and imports it as
       the distribution "UbuntuLab" (its virtual disk is %LOCALAPPDATA%\LabWSL\UbuntuLab\ext4.vhdx).
    3. Creates the lab account (user / 1234, sudo without a password), switches systemd on and sets the host name.
    4. Runs the kit's lab_install.sh in it - the installer that also builds the VirtualBox image: Docker Engine and
       Compose, a Python virtual environment with data / ML / AI libraries, PyTorch (CPU), Ollama, the cloud CLIs
       and Kubernetes tools chosen with -Extras, the Linux / Bash course tools and the ~/lab practice folder of
       MCMP117 (mcmp117_lab_setup.sh, found like Build-LabVM.ps1 finds it).
    5. Runs verify_lab, then creates the "Ubuntu Lab" shortcuts on the desktop and in the Start menu.

    Only the new distribution, two shortcuts and a cache folder are created. No administrator rights are needed when
    WSL is already installed. The downloaded image is cached in %LOCALAPPDATA%\LabWSL\cache, so a second install (for
    example after -Force) does not download it again. Everything the installer prints is also written to
    Install-LabWSL.log next to this script.

    Other uses:
      -Update        run the kit installer again inside the existing distribution (new kit version, repair)
      -Remove -Force delete the distribution and the shortcuts (the lab user's home folder is saved to
                     Documents\UbuntuLab-backups first)
      -Force         replace an existing distribution of the same name (home folder saved first)
      -Export FILE   save the finished distribution as a .tar file; a lab PC can then import it with -RootFs FILE
                     and skips the long installation

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Install-LabWSL.ps1

.EXAMPLE
    .\Install-LabWSL.ps1 -LabProfile devops -Extras none        # Linux and Docker only, no AI stack

.EXAMPLE
    .\Install-LabWSL.ps1 -Extras cloud,k8s,images,models -MemoryGB 16 -Processors 6
#>
[CmdletBinding()]
param(
    [string]$DistroName = 'UbuntuLab',
    [string]$ShortcutName = '',
    [string]$InstallDir = '',
    [ValidateSet('core', 'full', 'devops', 'ai', 'all')][string]$LabProfile = 'ai',
    [string[]]$Extras = @('cloud', 'k8s', 'images'),
    [string]$KeyMap = 'us',
    [string]$UserName = 'user',
    [string]$Password = '1234',
    [string]$RootFs = '',
    [string]$ImageUrl = '',
    [string[]]$CourseScript = @(),
    [string]$InstallArgs = '',
    [switch]$Services,
    [switch]$KeepWindowsPath,
    [int]$MemoryGB = 0,
    [int]$Processors = 0,
    [int]$SwapGB = -1,
    [switch]$InstallWsl,
    [switch]$Update,
    [switch]$Force,
    [switch]$Remove,
    [string]$Export = '',
    [switch]$NoShortcut,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot can be empty while default parameter values are evaluated (seen with Windows PowerShell 5.1
# started through the .cmd launcher), so the script folder is resolved explicitly, in the body, with fallbacks.
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir -and $MyInvocation.MyCommand.Path) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }

$script:Wsl = ''

# ----------------------------------------------------------------------------- helpers

function Exit-Script([int]$Code) {
    try { Stop-Transcript | Out-Null } catch { }
    if (-not $NoPause -and [Environment]::UserInteractive) {
        try { Read-Host 'Press Enter to close this window' | Out-Null } catch { }
    }
    exit $Code
}

function Write-Step([string]$Message) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

# One argument for a Windows command line (CommandLineToArgvW rules).
function ConvertTo-WinArg([string]$Arg) {
    if ($Arg -eq '') { return '""' }
    if ($Arg -notmatch '[\s"]') { return $Arg }
    $q = $Arg -replace '(\\*)"', '$1$1\"'
    $q = $q -replace '(\\+)$', '$1$1'
    return '"' + $q + '"'
}

function Get-TempFile([string]$Suffix) {
    return (Join-Path ([IO.Path]::GetTempPath()) ('labwsl-' + [guid]::NewGuid().ToString('N') + $Suffix))
}

function Read-TextLines([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return @() }
    $text = [IO.File]::ReadAllText($Path, (New-Object System.Text.UTF8Encoding($false)))
    $text = $text.Replace("`0", '').Replace("`r", '')
    $lines = @($text -split "`n")
    while ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') { $lines = @($lines | Select-Object -First ($lines.Count - 1)) }
    return $lines
}

# ----------------------------------------------------------------------------- wsl.exe

# Runs wsl.exe and returns { ExitCode, Lines, Text }. wsl.exe's own messages are UTF-16 unless WSL_UTF8=1 is set (older
# builds ignore the variable), so NUL characters are dropped in any case.
function Invoke-WslCapture([string[]]$WslArgs) {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'   # native stderr must not become a terminating error
    $prevUtf8 = $env:WSL_UTF8
    $env:WSL_UTF8 = '1'
    $code = 0
    $raw = $null
    try {
        $raw = & $script:Wsl @WslArgs 2>&1 | ForEach-Object { [string]$_ }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prevEap
        if ($null -eq $prevUtf8) { Remove-Item Env:\WSL_UTF8 -ErrorAction SilentlyContinue } else { $env:WSL_UTF8 = $prevUtf8 }
    }
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($l in @($raw)) {
        if ($null -eq $l) { continue }
        $lines.Add(([string]$l).Replace("`0", '').Replace("`r", '').TrimEnd())
    }
    return [pscustomobject]@{ ExitCode = $code; Lines = $lines.ToArray(); Text = ($lines.ToArray() -join "`n") }
}

# Runs a command in the distribution and shows its output while it runs; returns { ExitCode, Lines }.
function Invoke-WslLive([string]$Distro, [string[]]$Command, [string]$User = 'root') {
    $a = @('-d', $Distro, '-u', $User, '--cd', '/', '-e') + $Command
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $prevEnc = $null
    $prevUtf8 = $env:WSL_UTF8
    $env:WSL_UTF8 = '1'
    $collected = New-Object System.Collections.Generic.List[string]
    $code = 0
    try {
        try { $prevEnc = [Console]::OutputEncoding; [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch { }
        & $script:Wsl @a 2>&1 | ForEach-Object {
            $t = ([string]$_).Replace("`0", '').Replace("`r", '').TrimEnd()
            $collected.Add($t)
            Write-Host $t
        }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prevEap
        try { if ($null -ne $prevEnc) { [Console]::OutputEncoding = $prevEnc } } catch { }
        if ($null -eq $prevUtf8) { Remove-Item Env:\WSL_UTF8 -ErrorAction SilentlyContinue } else { $env:WSL_UTF8 = $prevUtf8 }
    }
    return [pscustomobject]@{ ExitCode = $code; Lines = $collected.ToArray() }
}

# Feeds a bash script to "bash -s" in the distribution through standard input (no quoting problems, no /mnt/c paths,
# and the file is byte-exact, unlike a PowerShell pipeline). Returns { ExitCode, Output, Error }.
function Invoke-WslScript([string]$Distro, [string]$Script, [string]$User = 'root') {
    $in = Get-TempFile '.sh'
    $out = $in + '.out'
    $err = $in + '.err'
    $prevUtf8 = $env:WSL_UTF8
    $env:WSL_UTF8 = '1'
    try {
        [IO.File]::WriteAllText($in, $Script.Replace("`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))
        $argLine = (@('-d', $Distro, '-u', $User, '--cd', '/', '-e', 'bash', '-s') | ForEach-Object { ConvertTo-WinArg $_ }) -join ' '
        $p = Start-Process -FilePath $script:Wsl -ArgumentList $argLine -RedirectStandardInput $in -RedirectStandardOutput $out `
            -RedirectStandardError $err -NoNewWindow -Wait -PassThru
        $null = $p.Handle   # without this ExitCode can stay empty
        $code = $p.ExitCode
        if ($null -eq $code) { $code = 1 }
        return [pscustomobject]@{ ExitCode = [int]$code; Output = @(Read-TextLines $out); Error = @(Read-TextLines $err) }
    } finally {
        if ($null -eq $prevUtf8) { Remove-Item Env:\WSL_UTF8 -ErrorAction SilentlyContinue } else { $env:WSL_UTF8 = $prevUtf8 }
        foreach ($f in @($in, $out, $err)) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue }
    }
}

function Get-WslDistros {
    $r = Invoke-WslCapture @('-l', '-q')
    if ($r.ExitCode -ne 0) { return @() }
    return @($r.Lines | Where-Object { $_ -match '^[A-Za-z0-9][A-Za-z0-9._-]*$' })
}

function Test-DistroRegistered([string]$Name) {
    return (@(Get-WslDistros | Where-Object { $_ -ieq $Name }).Count -gt 0)
}

function Stop-Distro([string]$Name) {
    [void](Invoke-WslCapture @('--terminate', $Name))
}

# Polls until systemd of the distribution has finished starting; returns the last state it saw.
function Wait-Systemd([string]$Distro, [int]$Seconds = 180) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $state = ''
    do {
        $r = Invoke-WslCapture @('-d', $Distro, '-u', 'root', '--cd', '/', '-e', 'systemctl', 'is-system-running')
        $state = [string]($r.Lines | Select-Object -First 1)
        if ($state -eq 'running' -or $state -eq 'degraded') { return $state }
        Start-Sleep -Seconds 3
    } while ($sw.Elapsed.TotalSeconds -lt $Seconds)
    return $state
}

function Get-WslInfo {
    $info = [pscustomobject]@{ Present = $false; Packaged = $false; Version = ''; Source = '' }
    $cmd = Get-Command wsl.exe -ErrorAction SilentlyContinue
    if (-not $cmd) { return $info }
    $script:Wsl = $cmd.Source
    $info.Present = $true
    $info.Source = $cmd.Source
    $r = Invoke-WslCapture @('--version')
    if ($r.ExitCode -eq 0 -and $r.Text -match '(\d+\.\d+\.\d+(\.\d+)?)') {
        $info.Packaged = $true
        $info.Version = $Matches[1]
    }
    return $info
}

function Test-IsAdmin {
    try {
        $id = [Security.Principal.WindowsIdentity]::GetCurrent()
        return (New-Object Security.Principal.WindowsPrincipal $id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch { return $false }
}

# Makes sure a current WSL (the packaged version, with systemd support) is installed. Returns $true when it is usable now.
function Initialize-Wsl {
    $info = Get-WslInfo
    if ($info.Packaged) {
        Write-Host ("  WSL        : {0}  ({1})" -f $info.Version, $info.Source)
        return $true
    }
    if ($info.Present) {
        Write-Warning 'wsl.exe is the old built-in version (no "wsl --version"); the lab needs the current WSL with systemd support.'
    } else {
        Write-Warning 'Windows Subsystem for Linux is not installed on this computer.'
    }
    if (-not $InstallWsl) {
        Write-Host ''
        Write-Host 'To install it, run this script again with -InstallWsl (Windows asks for administrator rights once, and the'
        Write-Host 'computer has to be restarted afterwards), or open an administrator terminal and run:'
        Write-Host '    wsl --install --no-distribution'
        Write-Host 'then restart Windows and start this installer again.'
        return $false
    }
    # An update of an existing WSL needs no administrator rights; a first installation does.
    if ($info.Present) {
        Write-Host '  Running: wsl --update'
        $r = Invoke-WslCapture @('--update')
        $r.Lines | ForEach-Object { Write-Host "    $_" }
        $info = Get-WslInfo
        if ($info.Packaged) { Write-Host ("  WSL        : {0}" -f $info.Version); return $true }
    }
    if (Test-IsAdmin) {
        Write-Host '  Running: wsl --install --no-distribution'
        $cmd = (Get-Command wsl.exe -ErrorAction SilentlyContinue)
        if (-not $cmd) { throw 'wsl.exe was not found; WSL needs Windows 10 version 2004 or Windows 11.' }
        $r = Invoke-WslCapture @('--install', '--no-distribution')
        $r.Lines | ForEach-Object { Write-Host "    $_" }
    } else {
        Write-Host '  Asking for administrator rights to run: wsl --install --no-distribution'
        $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        $cmdText = 'wsl.exe --install --no-distribution; Write-Host; Read-Host ''Press Enter to close this window'''
        try {
            $p = Start-Process -FilePath $ps -ArgumentList @('-NoProfile', '-Command', $cmdText) -Verb RunAs -Wait -PassThru
            $null = $p.Handle
        } catch {
            Write-Warning ('WSL was not installed: {0}' -f $_.Exception.Message)
            return $false
        }
    }
    Write-Host ''
    Write-Host 'WSL has been set up. Restart Windows, then start this installer again.' -ForegroundColor Yellow
    return $false
}

# ----------------------------------------------------------------------------- Ubuntu image

function Get-WebText([string]$Url) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $prev = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 60
        $c = $r.Content
        if ($c -is [byte[]]) { return [Text.Encoding]::UTF8.GetString($c) }
        return [string]$c
    } finally {
        $ProgressPreference = $prev
    }
}

function Get-ImageVersion([string]$Name) {
    if ($Name -match 'ubuntu-(\d+\.\d+)(?:\.(\d+))?-wsl') {
        $patch = '0'
        if ($Matches[2]) { $patch = $Matches[2] }
        return [version]("{0}.{1}" -f $Matches[1], $patch)
    }
    return [version]'0.0'
}

# The newest Ubuntu 24.04 WSL image on releases.ubuntu.com (point release changes the file name) with its SHA-256.
function Resolve-UbuntuImage {
    $sources = @(
        @{ Base = 'https://releases.ubuntu.com/noble/'; Pattern = 'ubuntu-24\.04(?:\.\d+)?-wsl-amd64\.wsl' },
        @{ Base = 'https://cloud-images.ubuntu.com/wsl/releases/noble/current/'; Pattern = 'ubuntu-noble-wsl-amd64-wsl\.rootfs\.tar\.gz' }
    )
    foreach ($s in $sources) {
        try {
            $html = Get-WebText $s.Base
            $names = @([regex]::Matches($html, $s.Pattern) | ForEach-Object { $_.Value } | Sort-Object -Unique)
            if ($names.Count -eq 0) { Write-Warning "No image found in $($s.Base)"; continue }
            $name = [string]($names | Sort-Object { Get-ImageVersion $_ } | Select-Object -Last 1)
            $sums = Get-WebText ($s.Base + 'SHA256SUMS')
            $m = [regex]::Match($sums, '(?m)^([0-9a-fA-F]{64})\s+\*?' + [regex]::Escape($name) + '\s*$')
            if (-not $m.Success) { Write-Warning "No checksum for $name in $($s.Base)SHA256SUMS"; continue }
            return [pscustomobject]@{ Name = $name; Url = ($s.Base + $name); Sha256 = $m.Groups[1].Value.ToLowerInvariant() }
        } catch {
            Write-Warning ("{0}: {1}" -f $s.Base, $_.Exception.Message)
        }
    }
    throw 'No Ubuntu 24.04 WSL image could be located on releases.ubuntu.com or cloud-images.ubuntu.com. Check the internet connection, or download the image yourself and pass it with -RootFs.'
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

function Get-Sha256([string]$Path) {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

# Returns the path of the root file system archive: -RootFs, or the cached / downloaded Ubuntu image.
function Get-RootFsFile([string]$LocalFile, [string]$Url, [string]$CacheDir) {
    if ($LocalFile) {
        if (-not (Test-Path -LiteralPath $LocalFile -PathType Leaf)) { throw "-RootFs file not found: $LocalFile" }
        $p = (Resolve-Path -LiteralPath $LocalFile).Path
        Write-Host "  Image      : $p  (given with -RootFs, not verified)"
        return $p
    }
    New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null
    $sha = ''
    if ($Url) {
        $name = Split-Path -Leaf ([uri]$Url).AbsolutePath
        if (-not $name) { throw "-ImageUrl has no file name: $Url" }
        Write-Warning '-ImageUrl: no checksum is available for this image, so it is not verified.'
    } else {
        $img = Resolve-UbuntuImage
        $name = $img.Name
        $Url = $img.Url
        $sha = $img.Sha256
    }
    $dest = Join-Path $CacheDir $name
    if (Test-Path -LiteralPath $dest) {
        if (-not $sha) {
            Write-Host "  Image      : $dest  (cached)"
            return $dest
        }
        if ((Get-Sha256 $dest) -eq $sha) {
            Write-Host "  Image      : $name  (cached copy matches the published checksum)"
            return $dest
        }
        Write-Warning "The cached $name does not match the published checksum; downloading it again."
        Remove-Item -LiteralPath $dest -Force
    }
    $part = $dest + '.part'
    if (Test-Path -LiteralPath $part) { Remove-Item -LiteralPath $part -Force }
    Get-RemoteFile $Url $part
    if ($sha) {
        $got = Get-Sha256 $part
        if ($got -ne $sha) {
            Remove-Item -LiteralPath $part -Force
            throw "SHA-256 of the downloaded $name is $got, expected $sha. The download was removed; run the installer again."
        }
        Write-Host "  SHA-256 verified: $sha"
    }
    Move-Item -LiteralPath $part -Destination $dest -Force
    return $dest
}

# ----------------------------------------------------------------------------- kit files

# Text files are normalised to LF without BOM (a Windows editor or Git may have changed them); binary files stay as they are.
function Get-GuestFileBytes([string]$Path) {
    $bytes = [IO.File]::ReadAllBytes($Path)
    $leaf = Split-Path -Leaf $Path
    $ext = [IO.Path]::GetExtension($leaf).ToLowerInvariant()
    $textExt = @('.sh', '.yml', '.yaml', '.md', '.txt', '.json', '.conf', '.cfg', '.ini', '.env', '.example', '.py', '.sql', '.html', '.css', '.js', '.csv', '.toml', '.service', '.timer', '.dockerignore', '')
    if ($textExt -notcontains $ext) { return $bytes }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $text = $utf8.GetString($bytes)
    if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) { $text = $text.Substring(1) }
    return $utf8.GetBytes($text.Replace("`r`n", "`n"))
}

function New-FileSpec([string]$Source, [string]$Target, [string]$Mode) {
    return [pscustomobject]@{ Source = $Source; Target = $Target; Mode = $Mode; Bytes = $null }
}

function New-TextSpec([string]$Text, [string]$Target, [string]$Mode) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    return [pscustomobject]@{ Source = ''; Target = $Target; Mode = $Mode; Bytes = $utf8.GetBytes($Text.Replace("`r`n", "`n")) }
}

# The files that go to /opt/lab in the distribution: installer, verification, docker assets, course scripts.
function Get-KitFileList([string]$KitDir, [string[]]$ExtraCourseScripts) {
    $specs = New-Object System.Collections.Generic.List[object]
    $specs.Add((New-FileSpec (Join-Path $KitDir 'lab_install.sh') '/opt/lab/lab_install.sh' '0755'))
    $specs.Add((New-FileSpec (Join-Path $KitDir 'verify_lab.sh') '/opt/lab/verify_lab.sh' '0755'))
    foreach ($sub in @('docker', 'courses')) {
        $root = Join-Path $KitDir $sub
        if (-not (Test-Path -LiteralPath $root)) { continue }
        $rootFull = (Get-Item -LiteralPath $root).FullName.TrimEnd('\', '/')
        foreach ($f in @(Get-ChildItem -LiteralPath $root -Recurse -File -Force)) {
            if ($f.Length -gt 5MB) { Write-Warning "Skipping $($f.FullName): larger than 5 MB."; continue }
            $rel = $f.FullName.Substring($rootFull.Length).TrimStart('\', '/').Replace('\', '/')
            if ($rel -notmatch '^[A-Za-z0-9._/@+-]+$') { Write-Warning "Skipping $($f.FullName): the name has characters outside A-Z a-z 0-9 . _ - @ +"; continue }
            $mode = '0644'
            if ($rel -like '*.sh') { $mode = '0755' }
            $specs.Add((New-FileSpec $f.FullName ("/opt/lab/$sub/$rel") $mode))
        }
    }
    foreach ($c in @($ExtraCourseScripts | Where-Object { $_ })) {   # an empty list arrives as $null
        $leaf = Split-Path -Leaf $c
        if ($leaf -notmatch '^[A-Za-z0-9._@+-]+$') { Write-Warning "Skipping course script ${c}: the name has unusual characters."; continue }
        $target = "/opt/lab/courses/$leaf"
        if (@($specs | Where-Object { $_.Target -eq $target }).Count -gt 0) { continue }   # courses\ already has it
        $mode = '0644'
        if ($leaf -like '*.sh') { $mode = '0755' }
        $specs.Add((New-FileSpec $c $target $mode))
    }
    return $specs.ToArray()
}

# -CourseScript files and, as a convenience, the MCMP117 / MBLP131 practice-folder generator when it lies next to the kit
# (the same places Build-LabVM.ps1 looks in).
function Find-CourseScripts([string]$Kit, [string[]]$Given) {
    $found = New-Object System.Collections.Generic.List[string]
    foreach ($c in @($Given)) {
        if (-not $c) { continue }
        # "powershell -File" passes a comma separated list as one string
        $candidates = @($c)
        if (-not (Test-Path -LiteralPath $c -PathType Leaf)) { $candidates = @($c -split ',') }
        foreach ($one in $candidates) {
            $one = $one.Trim()
            if ($one -and (Test-Path -LiteralPath $one -PathType Leaf)) { $found.Add((Resolve-Path -LiteralPath $one).Path) }
            elseif ($one) { Write-Warning "-CourseScript not found: $one" }
        }
    }
    $have = (Test-Path -LiteralPath (Join-Path $Kit 'courses\mcmp117_lab_setup.sh')) -or (@($found | Where-Object { (Split-Path -Leaf $_) -eq 'mcmp117_lab_setup.sh' }).Count -gt 0)
    if (-not $have) {
        $cands = @((Join-Path $Kit 'mcmp117_lab_setup.sh'), (Join-Path $Kit '..\_build\mcmp117_lab_setup.sh'))
        $parent = Split-Path -Parent $Kit
        if ($parent -and (Test-Path -LiteralPath $parent)) {
            $cands += (Join-Path $parent 'MBLP131\_build\mcmp117_lab_setup.sh')
            foreach ($d in @(Get-ChildItem -LiteralPath $parent -Directory -ErrorAction SilentlyContinue)) {
                $cands += (Join-Path $d.FullName 'MBLP131\_build\mcmp117_lab_setup.sh')
            }
        }
        foreach ($c in $cands) {
            if (Test-Path -LiteralPath $c -PathType Leaf) { $found.Add((Resolve-Path -LiteralPath $c).Path); break }
        }
    }
    return $found.ToArray()
}

# ----------------------------------------------------------------------------- scripts that run in the distribution

# Creates the lab account, the sudo rule and /etc/wsl.conf (systemd on, default user, host name).
$script:ConfigTemplate = @'
set -eu
export LC_ALL=C.UTF-8
USER_NAME='@@USER@@'
USER_PASS='@@PASS@@'
HOST_NAME='@@HOST@@'
APPEND_WIN_PATH='@@WINPATH@@'

if ! id "$USER_NAME" >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$USER_NAME"
fi
for g in adm sudo dialout cdrom floppy audio dip video plugdev netdev; do
    if getent group "$g" >/dev/null 2>&1; then usermod -aG "$g" "$USER_NAME"; fi
done
echo "$USER_NAME:$USER_PASS" | chpasswd
printf '%s ALL=(ALL) NOPASSWD:ALL\n' "$USER_NAME" > /etc/sudoers.d/90-lab-user
chmod 0440 /etc/sudoers.d/90-lab-user
visudo -cf /etc/sudoers.d/90-lab-user >/dev/null

cat > /etc/wsl.conf <<EOF
[boot]
systemd=true

[user]
default=$USER_NAME

[network]
hostname=$HOST_NAME
generateResolvConf=true

[interop]
enabled=true
appendWindowsPath=$APPEND_WIN_PATH

[automount]
enabled=true
options="metadata,umask=22,fmask=11"
EOF

# Ubuntu's WSL image runs cloud-init, which looks for user data on the Windows side at every start; the lab needs none.
install -d /etc/cloud
touch /etc/cloud/cloud-init.disabled
echo "configured: user $USER_NAME, host name $HOST_NAME"
'@

# Starts the kit installer; written to /opt/lab/wsl-run-install.sh.
$script:RunInstallTemplate = @'
#!/bin/bash
# Written by Install-LabWSL.ps1: runs the lab installer in this WSL distribution.
export LAB_WSL=1
export LAB_USER='@@USER@@'
export LAB_PROFILE='@@PROFILE@@'
export LAB_EXTRAS='@@EXTRAS@@'
export LAB_KEYMAP='@@KEYMAP@@'
export LAB_GUI=0
export LAB_WSL_SERVICES='@@SERVICES@@'
cd /opt/lab || exit 1
# shellcheck disable=SC2086
exec /opt/lab/lab_install.sh @@INSTALLARGS@@
'@

# Copies the kit into the distribution: a bash script with every file embedded as base64, read by "bash -s".
function New-KitPayload($Specs) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("set -eu`numask 022`n")
    [void]$sb.Append("put() {`n    install -d `"`$(dirname `"`$2`")`"`n    base64 -d > `"`$2`"`n    chmod `"`$1`" `"`$2`"`n}`n")
    [void]$sb.Append("rm -rf /opt/lab/docker /opt/lab/courses`ninstall -d /opt/lab`n")
    foreach ($s in $Specs) {
        $bytes = $s.Bytes
        if ($null -eq $bytes) { $bytes = Get-GuestFileBytes $s.Source }
        $b64 = [Convert]::ToBase64String($bytes)
        [void]$sb.Append("put $($s.Mode) $($s.Target) <<'LABKIT_EOF'`n")
        for ($i = 0; $i -lt $b64.Length; $i += 76) {
            $len = [Math]::Min(76, $b64.Length - $i)
            [void]$sb.Append($b64.Substring($i, $len)).Append("`n")
        }
        [void]$sb.Append("LABKIT_EOF`n")
    }
    [void]$sb.Append("echo `"kit copied to /opt/lab`"`n")
    return $sb.ToString()
}

# ----------------------------------------------------------------------------- Windows side

function Start-AwakeGuard {
    try {
        if (-not ('LabAwake' -as [type])) {
            Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class LabAwake { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f); }'
        }
        [void][LabAwake]::SetThreadExecutionState(2147483649)   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED: no sleep while installing
    } catch { }
}

function Stop-AwakeGuard {
    try { [void][LabAwake]::SetThreadExecutionState(2147483648) } catch { }
}

# An .ico file holding one 256 x 256 PNG image (the format Windows Vista and later read).
function Write-IcoFile([string]$Path, [byte[]]$Png) {
    $fs = [IO.File]::Open($Path, [IO.FileMode]::Create)
    try {
        $bw = New-Object IO.BinaryWriter $fs
        $bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)                       # ICONDIR: one image
        $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0)          # 256 x 256, no palette
        $bw.Write([uint16]1); $bw.Write([uint16]32)                                              # planes, bits per pixel
        $bw.Write([uint32]$Png.Length); $bw.Write([uint32]22)                                    # size, offset
        $bw.Write($Png)
        $bw.Flush()
    } finally { $fs.Dispose() }
}

# A small icon (dark rounded square with a green prompt) as .ico with one PNG image; $null when System.Drawing is unavailable.
function New-LabIcon([string]$Path) {
    try {
        Add-Type -AssemblyName System.Drawing
        $size = 256
        $bmp = New-Object System.Drawing.Bitmap $size, $size
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.Color]::Transparent)
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = 96
        $gp.AddArc(0, 0, $d, $d, 180, 90)
        $gp.AddArc($size - $d, 0, $d, $d, 270, 90)
        $gp.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $gp.AddArc(0, $size - $d, $d, $d, 90, 90)
        $gp.CloseFigure()
        $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 31, 41, 51))), $gp)
        $font = New-Object System.Drawing.Font 'Consolas', 112, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
        $g.DrawString('>_', $font, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 110, 231, 160))), 14, 62)
        $g.Dispose()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $png = $ms.ToArray()
        $bmp.Dispose()
        Write-IcoFile $Path $png
        return $Path
    } catch {
        Write-Warning ("Could not create the shortcut icon ({0}); the shortcuts use the WSL icon." -f $_.Exception.Message)
        return $null
    }
}

function Get-ShortcutPaths([string]$Display) {
    $paths = New-Object System.Collections.Generic.List[string]
    foreach ($kind in @('Desktop', 'Programs')) {
        try {
            $dir = [Environment]::GetFolderPath($kind)
            if ($dir -and (Test-Path -LiteralPath $dir)) { $paths.Add((Join-Path $dir ($Display + '.lnk'))) }
        } catch { }
    }
    return $paths.ToArray()
}

function New-LabShortcuts([string]$Display, [string]$Distro, [string]$IconFile) {
    $icon = "$($script:Wsl),0"
    if ($IconFile -and (Test-Path -LiteralPath $IconFile)) { $icon = "$IconFile,0" }
    $made = New-Object System.Collections.Generic.List[string]
    foreach ($lnk in @(Get-ShortcutPaths $Display)) {
        try {
            $ws = New-Object -ComObject WScript.Shell
            $sc = $ws.CreateShortcut($lnk)
            $sc.TargetPath = $script:Wsl
            $sc.Arguments = "-d $Distro --cd ~"
            $sc.WorkingDirectory = $env:USERPROFILE
            $sc.IconLocation = $icon
            $sc.Description = "Ubuntu 24.04 lab environment (WSL 2, distribution $Distro)"
            $sc.Save()
            $made.Add($lnk)
        } catch {
            Write-Warning ("Could not create the shortcut {0}: {1}" -f $lnk, $_.Exception.Message)
        }
    }
    return $made.ToArray()
}

function Remove-LabShortcuts([string]$Display) {
    foreach ($lnk in @(Get-ShortcutPaths $Display)) {
        if (Test-Path -LiteralPath $lnk) {
            try { Remove-Item -LiteralPath $lnk -Force; Write-Host "  Removed $lnk" } catch { Write-Warning "Could not remove ${lnk}: $($_.Exception.Message)" }
        }
    }
}

# --- %USERPROFILE%\.wslconfig (one file for all WSL 2 distributions) -----------------------------------

# Sets keys in the [wsl2] section and leaves everything else alone; $Values maps key -> text.
function Update-WslConfigText([string]$Text, [System.Collections.IDictionary]$Values) {
    $lines = New-Object System.Collections.Generic.List[string]
    if ($Text) { foreach ($l in ($Text -split "`r?`n")) { $lines.Add($l) } }
    while ($lines.Count -gt 0 -and $lines[$lines.Count - 1].Trim() -eq '') { $lines.RemoveAt($lines.Count - 1) }
    $start = -1
    $end = $lines.Count
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*\[(.+?)\]\s*$') {
            if ($start -ge 0) { $end = $i; break }
            if ($Matches[1].Trim().ToLowerInvariant() -eq 'wsl2') { $start = $i }
        }
    }
    if ($start -lt 0) {
        if ($lines.Count -gt 0) { $lines.Add('') }
        $lines.Add('[wsl2]')
        $start = $lines.Count - 1
        $end = $lines.Count
    }
    foreach ($key in $Values.Keys) {
        $done = $false
        for ($i = $start + 1; $i -lt $end; $i++) {
            if ($lines[$i] -match ('^\s*' + [regex]::Escape($key) + '\s*=')) { $lines[$i] = "$key=$($Values[$key])"; $done = $true; break }
        }
        if (-not $done) {
            $at = $end
            while ($at -gt ($start + 1) -and $lines[$at - 1].Trim() -eq '') { $at-- }
            $lines.Insert($at, "$key=$($Values[$key])")
            $end++
        }
    }
    return (($lines.ToArray() -join "`r`n") + "`r`n")
}

function Set-WslConfig([int]$MemGB, [int]$Cpus, [int]$SwapSizeGB) {
    $values = [ordered]@{}
    if ($MemGB -gt 0) { $values['memory'] = "${MemGB}GB" }
    if ($Cpus -gt 0) { $values['processors'] = "$Cpus" }
    if ($SwapSizeGB -ge 0) { $values['swap'] = "${SwapSizeGB}GB" }
    if ($values.Count -eq 0) { return $false }
    $path = Join-Path $env:USERPROFILE '.wslconfig'
    $old = ''
    if (Test-Path -LiteralPath $path) { $old = [IO.File]::ReadAllText($path) }
    $new = Update-WslConfigText $old $values
    if ($new.TrimEnd() -eq $old.TrimEnd()) { Write-Host "  .wslconfig : already has these values"; return $false }
    if ($old) {
        $bak = $path + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Copy-Item -LiteralPath $path -Destination $bak
        Write-Host "  .wslconfig : previous file saved as $bak"
    }
    [IO.File]::WriteAllText($path, $new, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ("  .wslconfig : {0}  (applies to all WSL distributions after: wsl --shutdown)" -f (($values.Keys | ForEach-Object { "$_=$($values[$_])" }) -join ', '))
    return $true
}

# Warns when .wslconfig lets WSL take almost all of the computer's memory (Docker and PyTorch then starve Windows).
function Test-WslMemoryCap {
    try {
        $path = Join-Path $env:USERPROFILE '.wslconfig'
        if (-not (Test-Path -LiteralPath $path)) { return }
        $m = [regex]::Match([IO.File]::ReadAllText($path), '(?im)^\s*memory\s*=\s*(\d+(?:\.\d+)?)\s*(GB|MB)?')
        if (-not $m.Success) { return }
        $cap = [double]$m.Groups[1].Value
        if ($m.Groups[2].Value -ieq 'MB') { $cap = $cap / 1024 }
        $total = [math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
        if ($total -gt 0 -and $cap -gt (0.75 * $total)) {
            Write-Warning (".wslconfig lets WSL use up to {0} GB of the {1} GB in this computer. Docker and PyTorch can then leave Windows too little; consider 16 GB: Install-LabWSL.ps1 -MemoryGB 16 (then wsl --shutdown)." -f $cap, $total)
        }
    } catch { }
}

function Test-DockerDesktop {
    if (@(Get-WslDistros | Where-Object { $_ -ieq 'docker-desktop' }).Count -gt 0) { return $true }
    foreach ($p in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'Docker\Docker\Docker Desktop.exe'))) { return $true }
    }
    return $false
}

# Saves the lab user's home folder (without caches) to Documents\UbuntuLab-backups; returns the file or $null.
function Backup-DistroHome([string]$Distro, [string]$User) {
    try {
        $docs = [Environment]::GetFolderPath('MyDocuments')
        if (-not $docs) { $docs = [IO.Path]::GetTempPath() }
        $dir = Join-Path $docs 'UbuntuLab-backups'
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        $file = Join-Path $dir ('home-{0}-{1}.tar.gz' -f $Distro, (Get-Date -Format 'yyyyMMdd-HHmmss'))
        if ($file.Contains("'")) { Write-Warning 'The backup path contains an apostrophe; the home folder is not saved.'; return $null }
        $script = "set -eu`ndest=`"`$(wslpath -u '$file')`"`ntar -czf `"`$dest`" --exclude='*/.cache' --exclude='*/.ollama' -C /home '$User' || { rc=`$?; [ `"`$rc`" -eq 1 ]; }`n"
        $r = Invoke-WslScript $Distro $script
        if ($r.ExitCode -eq 0 -and (Test-Path -LiteralPath $file)) {
            Write-Host ("  Home folder of '{0}' saved to {1} ({2} MB)" -f $User, $file, [math]::Round((Get-Item -LiteralPath $file).Length / 1MB))
            return $file
        }
        Write-Warning ("The home folder could not be saved: {0}" -f ((@($r.Error) + @($r.Output)) -join ' '))
    } catch {
        Write-Warning ("The home folder could not be saved: {0}" -f $_.Exception.Message)
    }
    return $null
}

# Removes the distribution (its virtual disk goes with it).
function Remove-LabDistro([string]$Distro, [string]$User, [string]$Dir) {
    if (-not (Test-DistroRegistered $Distro)) { return }
    Write-Host "  Saving the home folder before the distribution is removed ..."
    [void](Backup-DistroHome $Distro $User)
    Stop-Distro $Distro
    $r = Invoke-WslCapture @('--unregister', $Distro)
    if ($r.ExitCode -ne 0) { throw ("wsl --unregister {0} failed: {1}" -f $Distro, $r.Text) }
    Write-Host "  Distribution '$Distro' removed."
    if ($Dir -and (Test-Path -LiteralPath $Dir)) {
        $left = @(Get-ChildItem -LiteralPath $Dir -Force -ErrorAction SilentlyContinue)
        if ($left.Count -eq 0) { Remove-Item -LiteralPath $Dir -Force -ErrorAction SilentlyContinue }
    }
}

# A readable hint for the usual reasons why importing or starting a distribution fails.
function Get-WslErrorHint([string]$Text) {
    if ($Text -match '0x80370102|ensure virtualization is enabled|Virtual Machine Platform') {
        return 'Virtualization is switched off in the BIOS / UEFI (SVM Mode on AMD, Intel VT-x on Intel), or the Windows feature "Virtual Machine Platform" is missing (administrator terminal: wsl --install --no-distribution, then restart Windows).'
    }
    if ($Text -match '0x8007019e|optional component is not enabled') {
        return 'The Windows feature "Windows Subsystem for Linux" is not enabled: run "wsl --install --no-distribution" in an administrator terminal and restart Windows.'
    }
    if ($Text -match '0x800701bc') {
        return 'The WSL kernel is out of date: run "wsl --update".'
    }
    if ($Text -match '0x80070070|not enough space') {
        return 'The disk is full.'
    }
    return ''
}

# ----------------------------------------------------------------------------- the installation

function Invoke-LabWslInstall {
    $awake = $false
    try {
        # ---- parameters ---------------------------------------------------------------------------
        if ($DistroName -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$') { throw "-DistroName may contain only letters, digits, '.', '_' and '-'." }
        if ($UserName -notmatch '^[a-z_][a-z0-9_-]{0,30}$') { throw '-UserName must be a lower-case Linux account name.' }
        if ($Password -notmatch '^[A-Za-z0-9._@%+=,:/-]{1,64}$') { throw "-Password may contain only letters, digits and . _ @ % + = , : / -" }
        if (@('us', 'tr', 'us,tr', 'tr,us') -notcontains $KeyMap) { throw "-KeyMap must be us, tr or us,tr (got '$KeyMap')." }
        if ($InstallArgs -notmatch '^[A-Za-z0-9 _.,=:/@-]*$') { throw '-InstallArgs may contain only letters, digits, spaces and . , = : / @ _ -' }
        $extraList = @()
        foreach ($e in @($Extras)) { foreach ($p in ([string]$e -split '[,; ]+')) { if ($p) { $extraList += $p.ToLowerInvariant() } } }
        $extraList = @($extraList | Where-Object { $_ -ne 'none' } | Select-Object -Unique)
        foreach ($e in $extraList) {
            if (@('cloud', 'k8s', 'latex', 'models', 'images') -notcontains $e) { throw "Unknown extra '$e' (cloud, k8s, latex, models, images, or none)." }
        }
        $display = $ShortcutName
        if (-not $display) { if ($DistroName -eq 'UbuntuLab') { $display = 'Ubuntu Lab' } else { $display = $DistroName } }
        if ($display -notmatch '^[A-Za-z0-9 ._()-]+$') { throw '-ShortcutName has characters that are not allowed in a file name.' }
        $hostName = ($DistroName.ToLowerInvariant() -replace '[^a-z0-9-]', '-').Trim('-')
        if (-not $hostName) { $hostName = 'ubuntulab' }
        if ($hostName.Length -gt 63) { $hostName = $hostName.Substring(0, 63) }

        $kit = $ScriptDir
        $labRoot = Join-Path $(if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [IO.Path]::GetTempPath() }) 'LabWSL'
        $cacheDir = Join-Path $labRoot 'cache'
        $dir = $InstallDir
        if (-not $dir) { $dir = Join-Path $labRoot $DistroName }

        # The transcript goes next to the script; if that folder is read-only (a USB stick) it goes to the temp folder.
        $logPath = Join-Path $kit 'Install-LabWSL.log'
        try { Start-Transcript -LiteralPath $logPath -Force | Out-Null } catch {
            $logPath = Join-Path ([IO.Path]::GetTempPath()) 'Install-LabWSL.log'
            try { Start-Transcript -LiteralPath $logPath -Force | Out-Null } catch { }
        }
        Start-AwakeGuard
        $awake = $true

        $osBuild = [Environment]::OSVersion.Version.Build
        Write-Host ("Ubuntu Lab installer - distribution '{0}', profile {1}, extras: {2}" -f $DistroName, $LabProfile, $(if ($extraList.Count) { $extraList -join ',' } else { 'none' }))

        # ---- prerequisites ------------------------------------------------------------------------
        Write-Step 'Checking prerequisites'
        if ($osBuild -gt 0 -and $osBuild -lt 19041) { throw "WSL 2 needs Windows 10 version 2004 (build 19041) or later, or Windows 11 (this is build $osBuild)." }
        if (-not (Initialize-Wsl)) { Exit-Script 2; return }
        if ($DistroName -eq 'docker-desktop' -or $DistroName -eq 'docker-desktop-data') { throw "'$DistroName' is reserved by Docker Desktop; choose another -DistroName." }

        $exists = Test-DistroRegistered $DistroName

        # ---- -Remove / -Export ----------------------------------------------------------------------
        if ($Remove) {
            Write-Step "Removing '$DistroName'"
            if (-not $exists) {
                Write-Host '  That distribution is not installed.'
            } elseif (-not $Force) {
                Write-Host "  This deletes the distribution '$DistroName' with everything inside it (its virtual disk). The home folder of '$UserName'"
                Write-Host '  is saved to Documents\UbuntuLab-backups first. Run the command again with -Force to go on:'
                if ($DistroName -eq 'UbuntuLab') { Write-Host '      Install-LabWSL.cmd -Remove -Force' }
                else { Write-Host ('      Install-LabWSL.cmd -DistroName {0} -Remove -Force' -f $DistroName) }
                Exit-Script 0; return
            } else {
                Remove-LabDistro $DistroName $UserName $dir
            }
            Remove-LabShortcuts $display
            Exit-Script 0; return
        }
        if ($Export) {
            Write-Step "Exporting '$DistroName' to $Export"
            if (-not $exists) { throw "The distribution '$DistroName' is not installed." }
            $exportPath = [IO.Path]::GetFullPath($Export)
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $exportPath) | Out-Null
            Stop-Distro $DistroName
            Write-Host '  wsl --export runs for several minutes for a distribution of this size ...'
            $r = Invoke-WslCapture @('--export', $DistroName, $exportPath)
            if ($r.ExitCode -ne 0) { throw ("wsl --export failed: {0}" -f $r.Text) }
            $hash = Get-Sha256 $exportPath
            Set-Content -LiteralPath ($exportPath + '.sha256') -Value ('{0}  {1}' -f $hash, (Split-Path -Leaf $exportPath)) -Encoding ASCII
            Write-Host ("  Saved {0} ({1} MB), SHA-256 in {0}.sha256" -f $exportPath, [math]::Round((Get-Item -LiteralPath $exportPath).Length / 1MB))
            Write-Host "  On another computer:  Install-LabWSL.cmd -RootFs `"$exportPath`""
            Exit-Script 0; return
        }

        # ---- the kit's files -----------------------------------------------------------------------
        foreach ($req in @('lab_install.sh', 'verify_lab.sh')) {
            if (-not (Test-Path -LiteralPath (Join-Path $kit $req))) { throw "Missing kit file: $(Join-Path $kit $req) - run Install-LabWSL from the lab kit folder." }
        }
        $courseExtra = @(Find-CourseScripts $kit $CourseScript)
        $specs = Get-KitFileList $kit $courseExtra
        $courseSpecs = @($specs | Where-Object { $_.Target -like '/opt/lab/courses/*.sh' })
        $runScript = $script:RunInstallTemplate.Replace('@@USER@@', $UserName).Replace('@@PROFILE@@', $LabProfile).Replace('@@EXTRAS@@', ($extraList -join ',')).Replace('@@KEYMAP@@', $KeyMap)
        $servicesFlag = '0'
        if ($Services) { $servicesFlag = '1' }
        $runScript = $runScript.Replace('@@SERVICES@@', $servicesFlag).Replace('@@INSTALLARGS@@', $InstallArgs.Trim())
        $specs = @($specs) + @(New-TextSpec $runScript '/opt/lab/wsl-run-install.sh' '0755')

        Write-Host ''
        Write-Host ("Account   : {0} / {1}  (sudo without a password)" -f $UserName, $Password)
        Write-Host ("Disk      : {0}" -f $dir)
        if ($courseSpecs.Count -gt 0) {
            foreach ($c in $courseSpecs) {
                $src = $c.Source
                if (-not $src) { $src = '(generated)' }
                Write-Host ("Course    : {0}  <- {1}" -f (Split-Path -Leaf $c.Target), $src)
            }
        } else {
            Write-Host 'Course    : no course scripts found (put *.sh files into the courses folder to have them run during the install)'
        }
        if ($MemoryGB -gt 0 -or $Processors -gt 0 -or $SwapGB -ge 0) { [void](Set-WslConfig $MemoryGB $Processors $SwapGB) }
        Test-WslMemoryCap

        # ---- -Update: run the installer again in the existing distribution --------------------------------
        $freshInstall = $true
        $provisioned = $false
        if ($exists -and $Update) {
            $freshInstall = $false
            Write-Step "Updating '$DistroName' (the kit installer runs again)"
        } elseif ($exists -and -not $Force) {
            Write-Step "'$DistroName' is already installed"
            Write-Host "  Start it with the 'Ubuntu Lab' shortcut or:  wsl -d $DistroName"
            Write-Host '  -Update runs the kit installer again in it (repair, new kit version); -Force replaces it (the home folder is saved first).'
            if (-not $NoShortcut) {
                $icon = New-LabIcon (Join-Path $labRoot 'UbuntuLab.ico')
                $made = New-LabShortcuts $display $DistroName $icon
                foreach ($m in $made) { Write-Host "  Shortcut   : $m" }
            }
            Exit-Script 0; return
        } elseif ($exists -and $Force) {
            Write-Step "Replacing '$DistroName'"
            Remove-LabDistro $DistroName $UserName $dir
        } elseif (-not $exists -and $Update) {
            throw "-Update needs an installed distribution, but '$DistroName' does not exist. Run the installer without -Update."
        }

        if ($freshInstall) {
            # ---- image ---------------------------------------------------------------------------
            Write-Step 'Getting the Ubuntu 24.04 WSL image'
            $archive = Get-RootFsFile $RootFs $ImageUrl $cacheDir

            Write-Step "Importing the image as '$DistroName'"
            $freeText = 'free space unknown'
            $freeGB = -1
            try {
                $drive = New-Object System.IO.DriveInfo ([IO.Path]::GetPathRoot([IO.Path]::GetFullPath($dir)))
                $freeGB = [math]::Round($drive.AvailableFreeSpace / 1GB, 1)
                $freeText = "$freeGB GB free"
            } catch { }
            Write-Host "  Target     : $dir  ($freeText)"
            if ($freeGB -ge 0 -and $freeGB -lt 15) { throw "Only $freeGB GB are free on the drive of $dir; the lab software needs about 15 GB (more with -Extras models)." }
            if ($freeGB -ge 0 -and $freeGB -lt 30) { Write-Warning "Less than 30 GB free on the drive of $dir." }
            if ((Test-Path -LiteralPath $dir) -and @(Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue).Count -gt 0) {
                throw "The folder $dir is not empty (a leftover of an earlier installation?). Remove it, or choose another -InstallDir."
            }
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            $r = Invoke-WslCapture @('--import', $DistroName, $dir, $archive, '--version', '2')
            if ($r.ExitCode -ne 0) {
                $hint = Get-WslErrorHint $r.Text
                if ($hint) { $hint = [Environment]::NewLine + $hint }
                throw ("wsl --import failed (exit code {0}):{1}{2}{3}" -f $r.ExitCode, [Environment]::NewLine, $r.Text, $hint)
            }
            if (-not (Test-DistroRegistered $DistroName)) { throw "wsl --import reported success, but '$DistroName' is not in the distribution list." }
            Write-Host "  Imported."

            # An exported lab distribution (Install-LabWSL -Export) already carries everything.
            $probe = Invoke-WslCapture @('-d', $DistroName, '-u', 'root', '--cd', '/', '-e', 'test', '-f', '/var/lib/lab_install.done')
            if ($probe.ExitCode -eq 0) {
                $provisioned = $true
                Write-Host '  The image is an exported lab distribution: account, systemd and software are already in it.'
            } elseif ($probe.ExitCode -ne 1) {
                $hint = Get-WslErrorHint $probe.Text
                throw ("The new distribution could not be started (exit code {0}): {1} {2}" -f $probe.ExitCode, $probe.Text, $hint)
            }

            if (-not $provisioned) {
                Write-Step 'Creating the lab account and switching systemd on'
                $cfg = $script:ConfigTemplate.Replace('@@USER@@', $UserName).Replace('@@PASS@@', $Password).Replace('@@HOST@@', $hostName)
                $winPath = 'false'
                if ($KeepWindowsPath) { $winPath = 'true' }
                $cfg = $cfg.Replace('@@WINPATH@@', $winPath)
                $r = Invoke-WslScript $DistroName $cfg
                $r.Output | ForEach-Object { Write-Host "  $_" }
                if ($r.ExitCode -ne 0) { throw ("Configuring the distribution failed (exit code {0}): {1}" -f $r.ExitCode, ((@($r.Error) + @($r.Output)) -join ' ')) }
            }
        }

        # ---- systemd ---------------------------------------------------------------------------------
        Write-Step 'Starting the distribution with systemd'
        if ($freshInstall) { Stop-Distro $DistroName }      # wsl.conf is read when the distribution starts
        $state = Wait-Systemd $DistroName 180
        Write-Host "  systemd    : $state"
        if ($state -ne 'running' -and $state -ne 'degraded') {
            throw "systemd did not start in '$DistroName' (state '$state'). Check that /etc/wsl.conf contains [boot] systemd=true, run 'wsl --shutdown' and try again; WSL itself must be the current version ('wsl --update')."
        }

        $problems = New-Object System.Collections.Generic.List[string]
        if (-not $provisioned) {
            # ---- kit + installer -----------------------------------------------------------------------
            Write-Step 'Copying the lab kit into the distribution'
            $payload = New-KitPayload $specs
            $r = Invoke-WslScript $DistroName $payload
            $r.Output | ForEach-Object { Write-Host "  $_" }
            if ($r.ExitCode -ne 0) { throw ("Copying the kit failed (exit code {0}): {1}" -f $r.ExitCode, ((@($r.Error) + @($r.Output)) -join ' ')) }

            Write-Step 'Running the lab installer (this takes 15-45 minutes; the download size is several GB)'
            Write-Host '  The same installer builds the VirtualBox image. Its log is /var/log/lab_install.log in the distribution.'
            Write-Host ''
            $inst = Invoke-WslLive $DistroName @('bash', '/opt/lab/wsl-run-install.sh')
            if ($inst.ExitCode -ne 0) {
                $problems.Add("The lab installer ended with exit code $($inst.ExitCode) (essential parts are missing; see the end of its output above and /var/log/lab_install.log).")
            }

            # restart so that the docker group, the locale and the services of the new installation apply to the first session
            # (an -Update leaves open sessions alone: close them and run "wsl --terminate" yourself)
            if ($freshInstall) {
                Stop-Distro $DistroName
                [void](Wait-Systemd $DistroName 180)
            }
        }

        # ---- verification ---------------------------------------------------------------------------
        Write-Step 'Checking the installation (verify_lab)'
        $ver = Invoke-WslLive $DistroName @('verify_lab') $UserName
        $resultLine = [string]($ver.Lines | Where-Object { $_ -match '^Result:' } | Select-Object -Last 1)
        if ($ver.ExitCode -ne 0) {
            if ($resultLine) { $problems.Add("verify_lab: $resultLine") } else { $problems.Add("verify_lab ended with exit code $($ver.ExitCode).") }
        }

        # ---- shortcuts -------------------------------------------------------------------------------
        if (-not $NoShortcut) {
            Write-Step 'Creating the shortcuts'
            $icon = New-LabIcon (Join-Path $labRoot 'UbuntuLab.ico')
            $made = New-LabShortcuts $display $DistroName $icon
            foreach ($m in $made) { Write-Host "  Shortcut   : $m" }
        }

        # leave the distribution stopped: the shortcut starts it
        if ($freshInstall) { Stop-Distro $DistroName }

        Write-Host ''
        if ($problems.Count -eq 0) {
            Write-Host "$display is ready." -ForegroundColor Green
        } else {
            Write-Host "$display is installed, but with problems:" -ForegroundColor Yellow
            foreach ($p in $problems) { Write-Host "  - $p" -ForegroundColor Yellow }
        }
        if ($NoShortcut) {
            Write-Host ("  Start     : in any terminal:  wsl -d {0}" -f $DistroName)
        } else {
            Write-Host ("  Start     : the '{0}' shortcut (desktop and Start menu), or in any terminal:  wsl -d {1}" -f $display, $DistroName)
        }
        Write-Host ("  Account   : {0} / {1}   (sudo needs no password)" -f $UserName, $Password)
        Write-Host '  Inside    : verify_lab (acceptance test)   lab-info (overview)   lab-jupyter   lab-keyboard us|tr|us,tr'
        Write-Host '              Docker: docker run hello-world      compose stack: cd ~/labstack && docker compose up -d'
        Write-Host '              nginx / PostgreSQL / Redis are installed but off: sudo systemctl start nginx postgresql redis-server'
        Write-Host ("  Files     : the Linux home folder is \\wsl.localhost\{0}\home\{1}  (work inside it, not in /mnt/c, for speed and file permissions)" -f $DistroName, $UserName)
        if (Test-DockerDesktop) {
            Write-Host '  Note      : Docker Desktop is installed. Keep its "WSL integration" switched off for this distribution, otherwise the' -ForegroundColor Yellow
            Write-Host '              docker command here talks to Docker Desktop instead of the engine installed in it.' -ForegroundColor Yellow
        }
        $removeHint = 'Install-LabWSL.cmd -Remove -Force'
        if ($DistroName -ne 'UbuntuLab') { $removeHint = 'Install-LabWSL.cmd -DistroName {0} -Remove -Force' -f $DistroName }
        Write-Host ("  Remove    : {0}      Log: {1}" -f $removeHint, $logPath)
        if ($problems.Count -gt 0) { Exit-Script 1; return }
        Exit-Script 0
    }
    catch {
        Write-Host ''
        Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
        Exit-Script 1
    }
    finally {
        if ($awake) { Stop-AwakeGuard }
    }
}

# Dot-sourcing the file (. .\Install-LabWSL.ps1) only defines the functions - used by the test harness.
if ($MyInvocation.InvocationName -ne '.') { Invoke-LabWslInstall }
