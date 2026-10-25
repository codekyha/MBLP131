#!/usr/bin/env bash
# =============================================================================
# LabVM installer - one script for the Linux / Docker / Cloud / AI lab machines
#
# Runs on Ubuntu 22.04 / 24.04 and Debian 12 (VirtualBox or VMware guest, cloud VM, bare metal,
# container). Two ways to use it:
#   * Image build: cloud-init runs it inside the temporary build VM (Build-LabVM.ps1).
#   * By hand, on any machine:      sudo ./lab_install.sh --profile ai --gui
#
# Profiles (every profile includes the previous ones):
#   core    Linux/Bash practical: shell tools, gcc/gdb/strace, man pages, ssh, git, python3
#   full    + debugging and benchmark tools (valgrind, ltrace, cmake, perf, stress-ng, ...)
#   devops  + Docker Engine and Compose, nginx / PostgreSQL / Redis, network and monitoring tools
#   ai      + Python virtual environment with data / ML / AI libraries (PyTorch CPU, Hugging Face,
#             RAG, MLflow, Jupyter) and Ollama                                        (default)
#   all     = ai + extras cloud,k8s,latex,models
#
# Options (the environment variable that does the same is shown in brackets):
#   --profile NAME      core | full | devops | ai | all                  [LAB_PROFILE]
#   --gui / --no-gui    minimal Xfce desktop with LightDM                [LAB_GUI=1|0, default 0]
#   --autologin         log the lab user into the desktop automatically  [LAB_AUTOLOGIN=1|0]
#   --extras LIST       comma list of: cloud k8s latex models images     [LAB_EXTRAS]
#   --user NAME         account that owns the lab environment            [LAB_USER, default: sudo user]
#   --keymap LAYOUT     us | tr | us,tr (keyboard layout)                [LAB_KEYMAP, default us]
#   --venv DIR          Python virtual environment                       [LAB_VENV, default /opt/lab/venv]
#   --skip-upgrade      do not run "apt upgrade"                         [LAB_SKIP_UPGRADE=1]
#   --skip-docker --skip-ollama --skip-torch
#   --pull-images       pre-pull small Docker images                     [LAB_PULL_IMAGES=1]
#   --pull-models       pull Ollama models (same as extra "models")
#   --only LIST         run only the named modules (testing)
#   -h, --help          this text
#   Older MBBO205 options still work: --all --with-cloud --with-k8s --with-latex
#
# Other environment variables: LAB_IMAGE_BUILD=1 (set by the image build: progress on the serial
# console, services are not started while packages are installed), LAB_SSH_PASSWORD_AUTH=1,
# LAB_AUTO_UPDATES=0|1, LAB_DOCKER_SOURCE=auto|ubuntu|official, LAB_GUI_BROWSER=firefox|none,
# LAB_TORCH_INDEX=<url>, LAB_STRICT=1 (any failed item fails the run), LAB_LANG, LAB_LOCALES,
# LAB_CONTAINER=1 (treat the machine as a container: no Docker engine, hypervisor guest tools, system
# services or sshd; the Dockerfile sets it, "docker run" containers are detected automatically).
#
# WSL 2 (Windows Subsystem for Linux) is detected automatically; Install-LabWSL.ps1 prepares the distribution and
# runs this script in it. There the machine is a developer shell, not a server: no sshd and no desktop (WSLg shows
# Linux programs on the Windows desktop), and nginx / PostgreSQL / Redis / fail2ban / node exporter are installed
# but stay off until started (their ports are shared with Windows and with Docker containers). Docker and the
# services need systemd ([boot] systemd=true in /etc/wsl.conf). LAB_WSL=1|0 overrides the detection,
# LAB_WSL_SERVICES=1 starts the services at every boot as on the VM image.
#
# Course scripts: every courses/*.sh next to this script is run once as the lab user at the end.
# (a script that finished with status 0 is not run again; LAB_COURSE_FORCE=1 forces a re-run).
# Their data files (courses/ without the scripts, e.g. the code base archive opsys-code.tar.gz) go to /opt/lab/courses.
# Docker assets: docker/* next to this script is copied to ~/labstack.
# The script is idempotent: running it again repairs or completes an installation.
# =============================================================================
# shellcheck disable=SC2329  # the mod_* functions are called indirectly ("mod_$m")
set -uo pipefail

LABVM_VERSION="2026.10.3"
SELF="$(readlink -f "${BASH_SOURCE[0]}")"
SELF_DIR="$(dirname "$SELF")"
ORIG_ARGS=("$@")

# ------------------------------------------------------------------ settings
LAB_PROFILE="${LAB_PROFILE:-ai}"
LAB_GUI="${LAB_GUI:-0}"
LAB_AUTOLOGIN="${LAB_AUTOLOGIN:-}"
LAB_EXTRAS="${LAB_EXTRAS:-}"
LAB_KEYMAP="${LAB_KEYMAP:-us}"
LAB_VENV="${LAB_VENV:-/opt/lab/venv}"
LAB_LANG="${LAB_LANG:-en_US.UTF-8}"
LAB_LOCALES="${LAB_LOCALES:-en_US.UTF-8 tr_TR.UTF-8}"
LAB_IMAGE_BUILD="${LAB_IMAGE_BUILD:-0}"
LAB_STRICT="${LAB_STRICT:-0}"
LAB_SKIP_UPGRADE="${LAB_SKIP_UPGRADE:-0}"
LAB_SKIP_DOCKER="${LAB_SKIP_DOCKER:-0}"
LAB_SKIP_OLLAMA="${LAB_SKIP_OLLAMA:-0}"
LAB_SKIP_TORCH="${LAB_SKIP_TORCH:-0}"
LAB_PULL_IMAGES="${LAB_PULL_IMAGES:-}"
LAB_SSH_PASSWORD_AUTH="${LAB_SSH_PASSWORD_AUTH:-0}"
LAB_AUTO_UPDATES="${LAB_AUTO_UPDATES:-1}"
LAB_DOCKER_SOURCE="${LAB_DOCKER_SOURCE:-auto}"
LAB_GUI_BROWSER="${LAB_GUI_BROWSER:-firefox}"
LAB_TORCH_INDEX="${LAB_TORCH_INDEX:-https://download.pytorch.org/whl/cpu}"
LAB_DOCKER_IMAGES="${LAB_DOCKER_IMAGES:-hello-world alpine:3.20 ubuntu:24.04 nginx:1.27-alpine redis:7-alpine postgres:16-alpine python:3.12-slim}"
LAB_OLLAMA_MODELS="${LAB_OLLAMA_MODELS:-llama3.2:3b nomic-embed-text}"
LAB_COURSE_DIR="${LAB_COURSE_DIR:-$SELF_DIR/courses}"
LAB_DOCKER_ASSETS="${LAB_DOCKER_ASSETS:-$SELF_DIR/docker}"
LAB_USER="${LAB_USER:-}"
LAB_WSL_SERVICES="${LAB_WSL_SERVICES:-0}"
ENABLE_SSH="${ENABLE_SSH:-}"   # empty = decided below: 1 everywhere except WSL
INSTALL_TR_LOCALE="${INSTALL_TR_LOCALE:-1}"
SET_TR_KEYMAP="${SET_TR_KEYMAP:-0}"
LAB_LOG="${LAB_LOG:-/var/log/lab_install.log}"
ONLY=""

usage() { awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "$SELF"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need_arg() { [[ $# -ge 2 && -n "${2:-}" ]] || die "option $1 needs a value"; }

while [[ $# -gt 0 ]]; do
    case "$1" in
        --profile)       need_arg "$@"; LAB_PROFILE="$2"; shift ;;
        --gui)           LAB_GUI=1 ;;
        --no-gui)        LAB_GUI=0 ;;
        --autologin)     LAB_AUTOLOGIN=1 ;;
        --extras)        need_arg "$@"; LAB_EXTRAS="$2"; shift ;;
        --user)          need_arg "$@"; LAB_USER="$2"; shift ;;
        --keymap)        need_arg "$@"; LAB_KEYMAP="$2"; shift ;;
        --venv)          need_arg "$@"; LAB_VENV="$2"; shift ;;
        --only)          need_arg "$@"; ONLY="$2"; shift ;;
        --skip-upgrade)  LAB_SKIP_UPGRADE=1 ;;
        --skip-docker)   LAB_SKIP_DOCKER=1 ;;
        --skip-ollama)   LAB_SKIP_OLLAMA=1 ;;
        --skip-torch)    LAB_SKIP_TORCH=1 ;;
        --pull-images)   LAB_PULL_IMAGES=1 ;;
        --pull-models)   LAB_EXTRAS="${LAB_EXTRAS:+$LAB_EXTRAS,}models" ;;
        --all)           LAB_PROFILE=all ;;
        --with-cloud)    LAB_EXTRAS="${LAB_EXTRAS:+$LAB_EXTRAS,}cloud" ;;
        --with-k8s)      LAB_EXTRAS="${LAB_EXTRAS:+$LAB_EXTRAS,}k8s" ;;
        --with-latex)    LAB_EXTRAS="${LAB_EXTRAS:+$LAB_EXTRAS,}latex" ;;
        -h|--help)       usage; exit 0 ;;
        *)               die "unknown option: $1 (see --help)" ;;
    esac
    shift
done

# Re-run as root when started by a normal user (the lab environment is installed for that user).
if [[ $EUID -ne 0 ]]; then
    command -v sudo >/dev/null 2>&1 || die "run as root:  sudo $0"
    pass=()
    for k in $(compgen -e); do
        case "$k" in LAB_*|INSTALL_TR_LOCALE|SET_TR_KEYMAP|ENABLE_SSH) pass+=("$k=${!k}") ;; esac
    done
    exec sudo env "${pass[@]}" bash "$SELF" "${ORIG_ARGS[@]}"
fi

export HOME=/root
export LC_ALL=C.UTF-8
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a NEEDRESTART_SUSPEND=1 APT_LISTCHANGES_FRONTEND=none
export PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1

exec > >(tee -a "$LAB_LOG") 2>&1

START_TS=$(date +%s)
FAILED=()
CRITICAL=()
STEP=0
TOTAL=0

# ------------------------------------------------------------------- helpers
con() {   # one progress line for the host: the VirtualBox serial console is logged by Build-LabVM.ps1
    [[ "$LAB_IMAGE_BUILD" == "1" ]] || return 0
    printf 'LABVM: %s\n' "$*" >> /dev/console 2>/dev/null || true
}
log()  { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
warn() { printf 'WARNING: %s\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }
step() {
    STEP=$((STEP + 1))
    local mins=$(( ($(date +%s) - START_TS) / 60 ))
    printf '\n==> [%d/%d] %s   (%d min elapsed)\n' "$STEP" "$TOTAL" "$*" "$mins"
    con "step $STEP/$TOTAL $* (${mins} min)"
}
fail_item() { FAILED+=("$1"); warn "$1 failed"; }

APT_OPTS=(-y -q -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -o DPkg::Lock::Timeout=900 -o Acquire::Retries=3)
apt_get() { apt-get "${APT_OPTS[@]}" "$@"; }

apt_update() {   # the first boot of a cloud image can hold the apt lock for a while; retry
    local n=0
    until apt-get update -q -o Acquire::Retries=3 -o DPkg::Lock::Timeout=900; do
        n=$((n + 1))
        if (( n >= 10 )); then return 1; fi
        warn "apt update failed (lock or network); retry $n/10 in 15 s"
        sleep 15
    done
}

apt_install() {   # whole list first (fast); on failure package by package, recording what is missing
    (( $# )) || return 0
    if apt_get install --no-install-recommends "$@"; then return 0; fi
    warn "bulk apt install failed; repairing and retrying package by package"
    dpkg --configure -a >/dev/null 2>&1 || true
    apt_get -f install >/dev/null 2>&1 || true
    local p
    for p in "$@"; do
        apt_get install --no-install-recommends "$p" || fail_item "apt:$p"
    done
    return 0
}

apt_has() { apt-cache show "$1" >/dev/null 2>&1; }

pip_group() {   # pip_group "description" pkg...   (whole group first, then one by one)
    local desc=$1
    shift
    log "pip: $desc"
    if "$PIP" install --retries 10 --timeout 60 "$@"; then return 0; fi
    warn "pip group '$desc' failed; retrying package by package"
    local p
    for p in "$@"; do
        "$PIP" install --retries 10 --timeout 60 "$p" || fail_item "pip:$p"
    done
    return 0
}

has_extra() { [[ ",$LAB_EXTRAS," == *",$1,"* ]]; }

# Run a command as the lab user with a login-like environment.
as_user() { sudo -u "$LAB_USER" -H "$@"; }

svc_enable() {   # enable units; start them too unless an image is being built
    (( HAS_SYSTEMD )) || return 0
    local s
    for s in "$@"; do
        systemctl enable "$s" >/dev/null 2>&1 || warn "could not enable $s"
        if [[ "$LAB_IMAGE_BUILD" != "1" ]]; then
            systemctl start "$s" >/dev/null 2>&1 || warn "could not start $s"
        fi
    done
}

POLICY=/usr/sbin/policy-rc.d
POLICY_SET=0
policy_block() {   # while packages are installed into an image, do not start their services
    if [[ "$LAB_IMAGE_BUILD" == "1" && ! -e $POLICY ]]; then
        printf '#!/bin/sh\nexit 101\n' > "$POLICY"
        chmod 755 "$POLICY"
        POLICY_SET=1
    fi
}
policy_release() { if [[ "$POLICY_SET" == "1" ]]; then rm -f "$POLICY"; POLICY_SET=0; fi; }
trap policy_release EXIT

require_cmds() { local c; for c in "$@"; do have "$c" || CRITICAL+=("command:$c"); done; }
require_files() { local f; for f in "$@"; do [[ -e $f ]] || CRITICAL+=("file:$f"); done; }

# ------------------------------------------------------------ environment ---
IN_CONTAINER=0
if [[ "${LAB_CONTAINER:-0}" == "1" || -f /.dockerenv ]] || grep -qaE '(docker|containerd|lxc|kubepods)' /proc/1/cgroup 2>/dev/null; then IN_CONTAINER=1; fi
HAS_SYSTEMD=0
[[ -d /run/systemd/system ]] && HAS_SYSTEMD=1

# WSL 2: a real Linux kernel under Windows. A container on a WSL host shows the same kernel name, hence the IN_CONTAINER test.
IN_WSL=0
if (( ! IN_CONTAINER )) && { [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -qiE 'microsoft|wsl' /proc/sys/kernel/osrelease 2>/dev/null; }; then IN_WSL=1; fi
case "${LAB_WSL:-}" in 1) IN_WSL=1 ;; 0) IN_WSL=0 ;; esac
if [[ -z "$ENABLE_SSH" ]]; then
    if (( IN_WSL )); then ENABLE_SSH=0; else ENABLE_SSH=1; fi
fi
if (( IN_WSL )) && [[ "$LAB_GUI" == "1" ]]; then
    warn "WSL: the Xfce desktop is for virtual machines (Linux programs appear on the Windows desktop through WSLg); continuing without it"
    LAB_GUI=0
fi

# shellcheck disable=SC1091
. /etc/os-release
DISTRO_ID="${ID:-unknown}"
CODENAME="${VERSION_CODENAME:-}"
ARCH="$(dpkg --print-architecture 2>/dev/null || echo amd64)"
case "$DISTRO_ID" in
    ubuntu|debian) ;;
    *) die "unsupported distribution '$DISTRO_ID'. Use Ubuntu 22.04/24.04 or Debian 12, or the Docker image (docker/)." ;;
esac

case "$LAB_PROFILE" in
    core) LEVEL=1 ;;
    full) LEVEL=2 ;;
    devops) LEVEL=3 ;;
    ai) LEVEL=4 ;;
    all) LEVEL=5; LAB_EXTRAS="cloud,k8s,latex,models${LAB_EXTRAS:+,$LAB_EXTRAS}" ;;
    *) die "unknown profile '$LAB_PROFILE' (core, full, devops, ai, all)" ;;
esac
if (( IN_WSL && ! HAS_SYSTEMD && LEVEL >= 3 )); then
    die "this WSL distribution runs without systemd, which Docker and the system services need. Put the lines [boot] and systemd=true into /etc/wsl.conf, run 'wsl --shutdown' in Windows and open the distribution again (Install-LabWSL.ps1 does this for you)."
fi
[[ "$SET_TR_KEYMAP" == "1" && "$LAB_KEYMAP" == "us" ]] && LAB_KEYMAP="tr"
case "$LAB_KEYMAP" in us|tr|us,tr|tr,us) ;; *) die "unknown keymap '$LAB_KEYMAP' (us, tr, us,tr)" ;; esac
[[ "$LAB_GUI" == "1" && -z "$LAB_AUTOLOGIN" ]] && LAB_AUTOLOGIN="$LAB_IMAGE_BUILD"
[[ -z "$LAB_PULL_IMAGES" ]] && LAB_PULL_IMAGES="$LAB_IMAGE_BUILD"
has_extra images && LAB_PULL_IMAGES=1

if (( IN_CONTAINER )); then
    LAB_SKIP_DOCKER=1
    (( HAS_SYSTEMD )) || LAB_SKIP_OLLAMA=1
fi

# lab user
if [[ -z "$LAB_USER" ]]; then
    if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != root ]]; then LAB_USER="$SUDO_USER"
    elif id user >/dev/null 2>&1; then LAB_USER=user
    else LAB_USER=user
    fi
fi

# ----------------------------------------------------------------- the plan -
PLAN=(base)
(( LEVEL >= 2 )) && PLAN+=(full)
(( LEVEL >= 3 )) && PLAN+=(devops)
PLAN+=(locale)
[[ "$ENABLE_SSH" == "1" ]] && PLAN+=(ssh)
[[ "$LAB_GUI" == "1" ]] && PLAN+=(gui)
PLAN+=(guest)
(( LEVEL >= 3 )) && PLAN+=(services)
(( LEVEL >= 3 )) && [[ "$LAB_SKIP_DOCKER" != "1" ]] && PLAN+=(docker)
(( LEVEL >= 4 )) && PLAN+=(python)
(( LEVEL >= 4 )) && [[ "$LAB_SKIP_TORCH" != "1" ]] && PLAN+=(ai)
(( LEVEL >= 4 )) && [[ "$LAB_SKIP_OLLAMA" != "1" ]] && PLAN+=(ollama)
has_extra cloud && PLAN+=(cloud)
has_extra k8s && PLAN+=(k8s)
has_extra latex && PLAN+=(latex)
has_extra models && [[ "$LAB_SKIP_OLLAMA" != "1" ]] && PLAN+=(models)
PLAN+=(courses userenv finish)

TOTAL=${#PLAN[@]}

# ==================================================================== modules
mod_base() {
    step "System update and base packages"
    # Minimized images (Docker's ubuntu, "minimal" cloud images) tell dpkg to skip manual pages; the Linux
    # course relies on man(1), so the exclusion is lifted before anything else is installed or upgraded.
    local dpkg_excludes=/etc/dpkg/dpkg.cfg.d/excludes
    if [[ -f $dpkg_excludes ]] && grep -qE '^path-exclude=/usr/share/man' "$dpkg_excludes"; then
        log "lifting the dpkg exclusion of manual pages"
        sed -i -E 's|^(path-exclude=/usr/share/man)|#\1|' "$dpkg_excludes"
    fi
    apt_update || die "apt update failed - no network or no reachable mirror"
    if [[ "$LAB_SKIP_UPGRADE" != "1" ]]; then
        apt_get upgrade || warn "apt upgrade failed; continuing"
    fi
    local pkgs=(
        build-essential gcc make gdb strace
        manpages-dev man-db
        bash bash-completion coreutils findutils grep sed gawk diffutils
        less file tree bc jq zip unzip tar gzip bzip2 xz-utils rsync
        vim nano tmux
        procps psmisc lsof htop sysstat
        iproute2 net-tools iputils-ping dnsutils curl wget netcat-openbsd traceroute
        git ca-certificates gnupg openssh-client sudo
        python3
        locales
    )
    apt_install "${pkgs[@]}"
    # Packages that were installed while the manual pages were excluded have to be unpacked again.
    if [[ ! -e /usr/share/man/man1/ls.1.gz ]]; then
        log "restoring the manual pages of the base system"
        apt_get install --reinstall coreutils findutils grep sed gawk diffutils tar gzip bash util-linux procps less file passwd login \
            || warn "could not reinstall packages to restore manual pages"
    fi
    if [[ ! -e /usr/share/man/man1/ls.1.gz ]] && have unminimize; then
        log "restoring manual pages (unminimize)"
        yes | unminimize || true
    fi
    apt-get clean
    require_cmds bash gcc make gdb strace git python3 vim tmux man jq bc curl wget rsync
}

mod_full() {
    step "Debugging and benchmark tools"
    local pkgs=(
        g++ cmake ltrace valgrind
        manpages-posix manpages-posix-dev
        shellcheck dos2unix pv moreutils screen
        iotop iftop stress-ng cpulimit util-linux
        software-properties-common python3-pip python3-venv
    )
    if [[ "$DISTRO_ID" == ubuntu ]]; then pkgs+=(linux-tools-generic); else pkgs+=(linux-perf); fi
    apt_install "${pkgs[@]}"
    apt-get clean
    require_cmds g++ cmake ltrace valgrind shellcheck
}

mod_devops() {
    step "Network, database client and monitoring tools"
    local pkgs=(
        lsb-release apt-transport-https pkg-config
        git-lfs tig
        btop nmon ncdu yq p7zip-full zstd
        mtr-tiny nmap tcpdump iperf3 openssl socat fio pciutils
        cron logrotate acl attr
        sqlite3 postgresql-client mariadb-client redis-tools
        ripgrep fd-find fzf
        graphviz imagemagick poppler-utils
        apache2-utils wrk
    )
    apt_install "${pkgs[@]}"
    git lfs install --system --skip-repo >/dev/null 2>&1 || true
    apt-get clean
    require_cmds nmap tcpdump rg sqlite3 psql redis-cli ab
}

mod_locale() {
    step "Locales, keyboard and defaults"
    local l
    if [[ "$INSTALL_TR_LOCALE" != "1" ]]; then LAB_LOCALES="en_US.UTF-8"; fi
    if [[ -f /etc/locale.gen ]]; then
        for l in $LAB_LOCALES; do
            sed -i "s/^# *\(${l//./\\.} UTF-8\)/\1/" /etc/locale.gen
            grep -q "^${l//./\\.} UTF-8" /etc/locale.gen || echo "$l UTF-8" >> /etc/locale.gen
        done
        locale-gen
    else
        # shellcheck disable=SC2086
        locale-gen $LAB_LOCALES
    fi
    update-locale LANG="$LAB_LANG"
    write_keyboard "$LAB_KEYMAP"
    # No screen blanking on virtual machines (harmless when there is no X server).
    install -d /etc/X11/xorg.conf.d
    cat > /etc/X11/xorg.conf.d/10-lab-noblank.conf <<'EOF'
Section "ServerFlags"
    Option "BlankTime" "0"
    Option "StandbyTime" "0"
    Option "SuspendTime" "0"
    Option "OffTime" "0"
EndSection
EOF
    # Lab images update on request only: no background apt runs on 30 machines at once.
    if [[ "$LAB_AUTO_UPDATES" == "0" ]]; then
        cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Unattended-Upgrade "0";
EOF
    fi
}

write_keyboard() {   # write_keyboard us|tr|us,tr  - console (/etc/default/keyboard) and X11 (xorg.conf.d)
    local layout=$1 opts=""
    case "$layout" in *,*) opts="grp:alt_shift_toggle" ;; esac
    cat > /etc/default/keyboard <<EOF
XKBMODEL="pc105"
XKBLAYOUT="$layout"
XKBVARIANT=""
XKBOPTIONS="$opts"
BACKSPACE="guess"
EOF
    install -d /etc/X11/xorg.conf.d
    cat > /etc/X11/xorg.conf.d/00-keyboard.conf <<EOF
Section "InputClass"
        Identifier "system-keyboard"
        MatchIsKeyboard "on"
        Option "XkbLayout" "$layout"
        Option "XkbModel" "pc105"
        Option "XkbOptions" "$opts"
EndSection
EOF
}

write_lab_sysctl() {   # part of the SSH step; WSL has no sshd but needs the same setting (see mod_userenv)
    cat > /etc/sysctl.d/99-lab.conf <<'EOF'
# gdb and strace may attach to the user's own processes
kernel.yama.ptrace_scope = 0
EOF
    sysctl --system >/dev/null 2>&1 || true
}

mod_ssh() {
    step "OpenSSH server"
    apt_install openssh-server
    if [[ "$LAB_SSH_PASSWORD_AUTH" == "1" ]]; then
        # Ubuntu cloud images disable password logins; this lab image needs them (shared lab account).
        install -d /etc/ssh/sshd_config.d
        printf 'PasswordAuthentication yes\n' > /etc/ssh/sshd_config.d/40-lab.conf
    fi
    write_lab_sysctl
    if (( HAS_SYSTEMD )); then
        systemctl enable ssh >/dev/null 2>&1 || warn "could not enable ssh"
        if [[ "$LAB_IMAGE_BUILD" != "1" ]]; then systemctl restart ssh >/dev/null 2>&1 || true; fi
    fi
    require_cmds sshd
}

mod_gui() {
    step "Minimal desktop (Xfce + LightDM)"
    # A display manager asks which one is the default when several are installed; we install one.
    echo "lightdm shared/default-x-display-manager select lightdm" | debconf-set-selections 2>/dev/null || true
    local pkgs=(
        xserver-xorg-core xserver-xorg-input-libinput xinit x11-xserver-utils x11-utils xauth dbus-x11
        lightdm lightdm-gtk-greeter
        xfce4-session xfce4-panel xfce4-settings xfwm4 xfdesktop4 xfce4-terminal xfce4-appfinder
        thunar mousepad gvfs
        adwaita-icon-theme hicolor-icon-theme fonts-dejavu-core
        xdg-utils xdg-user-dirs
    )
    apt_install "${pkgs[@]}"

    install -d /etc/lightdm/lightdm.conf.d
    {
        echo "[Seat:*]"
        echo "greeter-session=lightdm-gtk-greeter"
        echo "user-session=xfce"
        if [[ "$LAB_AUTOLOGIN" == "1" ]]; then
            echo "autologin-user=$LAB_USER"
            echo "autologin-user-timeout=0"
            echo "autologin-session=xfce"
        fi
    } > /etc/lightdm/lightdm.conf.d/50-lab.conf

    # Preferred applications for the panel launchers.
    install -d /etc/xdg/xfce4
    cat > /etc/xdg/xfce4/helpers.rc <<'EOF'
TerminalEmulator=xfce4-terminal
FileManager=Thunar
EOF

    # boot into the desktop
    ln -sf /lib/systemd/system/graphical.target /etc/systemd/system/default.target
    if [[ -e /lib/systemd/system/lightdm.service && ! -e /etc/systemd/system/display-manager.service ]]; then
        ln -sf /lib/systemd/system/lightdm.service /etc/systemd/system/display-manager.service
    fi
    echo /usr/sbin/lightdm > /etc/X11/default-display-manager

    if [[ "$LAB_GUI_BROWSER" == "firefox" ]]; then
        install_firefox || fail_item "firefox"
        if [[ -x /usr/bin/firefox ]]; then echo "WebBrowser=firefox" >> /etc/xdg/xfce4/helpers.rc; fi
    fi
    apt-get clean
    require_cmds lightdm xfce4-session xfce4-panel xfwm4 xfdesktop xfce4-terminal thunar mousepad Xorg
    require_files /usr/share/xsessions/xfce.desktop
}

install_firefox() {   # real Firefox from Mozilla's apt repository (Ubuntu's package is only a snap stub)
    local keyring=/etc/apt/keyrings/packages.mozilla.org.asc
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL --retry 3 https://packages.mozilla.org/apt/repo-signing-key.gpg -o "$keyring" || return 1
    echo "deb [signed-by=$keyring] https://packages.mozilla.org/apt mozilla main" > /etc/apt/sources.list.d/mozilla.list
    printf 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n' > /etc/apt/preferences.d/mozilla
    apt_update || return 1
    apt_get install --no-install-recommends firefox || return 1
}

mod_guest() {
    step "Guest integration for the detected hypervisor"
    if (( IN_CONTAINER )); then echo "Container: no hypervisor guest tools."; return 0; fi
    local hv
    hv="$(systemd-detect-virt 2>/dev/null || echo none)"
    echo "Hypervisor: $hv"
    case "$hv" in
        oracle)   # VirtualBox
            apt_install virtualbox-guest-utils
            if dpkg -s xserver-xorg-core >/dev/null 2>&1; then apt_install virtualbox-guest-x11; fi
            usermod -aG vboxsf "$LAB_USER" 2>/dev/null || true
            ;;
        vmware)
            apt_install open-vm-tools
            if dpkg -s xserver-xorg-core >/dev/null 2>&1; then apt_install open-vm-tools-desktop; fi
            ;;
        *)
            echo "No guest tools installed for '$hv'."
            ;;
    esac
    apt-get clean
}

mod_services() {
    step "Server software: nginx, PostgreSQL, Redis, firewall, monitoring"
    if (( IN_CONTAINER )); then
        apt_install nginx-light
    else
        apt_install ufw fail2ban nginx postgresql redis-server prometheus-node-exporter
        if (( HAS_SYSTEMD )); then
            local s
            if (( IN_WSL )) && [[ "$LAB_WSL_SERVICES" != "1" ]]; then
                # A WSL distribution is a developer shell: the services are installed (systemctl, ufw and the clients work)
                # but stay off, because their ports are shared with Windows and with the containers of the Docker labs.
                for s in nginx postgresql redis-server fail2ban prometheus-node-exporter; do
                    systemctl disable --now "$s" >/dev/null 2>&1 || warn "could not switch off $s"
                done
                echo "WSL: nginx, PostgreSQL, Redis, fail2ban and node exporter are installed but off."
                echo "     Start them when needed: sudo systemctl start nginx postgresql redis-server   (LAB_WSL_SERVICES=1 starts them at every boot)"
            else
                for s in nginx postgresql redis-server fail2ban prometheus-node-exporter; do
                    systemctl enable "$s" >/dev/null 2>&1 || warn "could not enable $s"
                    if [[ "$LAB_IMAGE_BUILD" != "1" ]]; then systemctl start "$s" >/dev/null 2>&1 || warn "could not start $s"; fi
                done
            fi
        fi
        # Rules are defined but the firewall is left off, so nobody is locked out of a lab machine.
        ufw allow OpenSSH >/dev/null 2>&1 || true
        ufw allow 80/tcp >/dev/null 2>&1 || true
        ufw allow 443/tcp >/dev/null 2>&1 || true
    fi
    apt-get clean
    require_cmds nginx
}

docker_from_ubuntu() {
    apt_has docker-compose-v2 || return 1
    local pkgs=(docker.io docker-compose-v2)
    if apt_has docker-buildx; then pkgs+=(docker-buildx); fi
    apt_get install --no-install-recommends "${pkgs[@]}"
}

docker_from_official() {
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL --retry 3 "https://download.docker.com/linux/${DISTRO_ID}/gpg" -o /etc/apt/keyrings/docker.asc || return 1
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${DISTRO_ID} ${CODENAME} stable" \
        > /etc/apt/sources.list.d/docker.list
    apt_update || return 1
    apt_get install --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

mod_docker() {
    step "Docker Engine, Compose and Buildx"
    local ok=0
    case "$LAB_DOCKER_SOURCE" in
        ubuntu)   docker_from_ubuntu && ok=1 ;;
        official) docker_from_official && ok=1 ;;
        *)
            if [[ "$DISTRO_ID" == ubuntu ]]; then
                docker_from_ubuntu && ok=1
                (( ok )) || { warn "distribution packages unavailable; trying Docker's repository"; docker_from_official && ok=1; }
            else
                docker_from_official && ok=1
                (( ok )) || { warn "Docker's repository unavailable; trying distribution packages"; docker_from_ubuntu && ok=1; }
            fi
            ;;
    esac
    if (( ! ok )); then
        CRITICAL+=("docker:install")
        return 0
    fi
    install -d /etc/docker
    if [[ ! -e /etc/docker/daemon.json ]]; then
        cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
    fi
    getent group docker >/dev/null 2>&1 || groupadd docker
    usermod -aG docker "$LAB_USER" 2>/dev/null || true
    if (( HAS_SYSTEMD )); then
        systemctl enable docker containerd >/dev/null 2>&1 || warn "could not enable docker"
        if [[ "$LAB_IMAGE_BUILD" != "1" ]]; then systemctl start docker >/dev/null 2>&1 || warn "could not start docker"; fi
    fi
    if [[ "$LAB_PULL_IMAGES" == "1" ]]; then docker_prepull; fi
    apt-get clean
    require_cmds docker
    docker compose version >/dev/null 2>&1 || CRITICAL+=("docker:compose")
}

docker_prepull() {
    if (( ! HAS_SYSTEMD )); then warn "no systemd: Docker images are not pre-pulled"; return 0; fi
    log "pre-pulling Docker images: $LAB_DOCKER_IMAGES"
    systemctl start docker >/dev/null 2>&1 || { warn "docker daemon did not start"; return 0; }
    local n
    for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done
    local img
    for img in $LAB_DOCKER_IMAGES; do
        n=0
        until docker pull "$img"; do
            n=$((n + 1))
            if (( n >= 3 )); then fail_item "docker-image:$img"; break; fi
            sleep 10
        done
    done
    docker run --rm hello-world >/dev/null 2>&1 || warn "docker run hello-world did not work"
    if [[ "$LAB_IMAGE_BUILD" == "1" ]]; then systemctl stop docker docker.socket >/dev/null 2>&1 || true; fi
}

mod_python() {
    step "Python 3, virtual environment and data / ML libraries"
    apt_install python3 python3-pip python3-venv python3-dev python3-full pipx \
        libpq-dev libffi-dev libssl-dev libxml2-dev libxslt1-dev libjpeg-dev zlib1g-dev
    install -d "$(dirname "$LAB_VENV")"
    [[ -x "$LAB_VENV/bin/python" ]] || python3 -m venv "$LAB_VENV"
    PIP="$LAB_VENV/bin/pip"
    "$PIP" install --upgrade pip wheel setuptools || warn "pip could not be upgraded"

    pip_group "data science (core)" \
        numpy scipy pandas polars pyarrow fastparquet openpyxl xlsxwriter lxml beautifulsoup4 \
        matplotlib seaborn plotly
    pip_group "machine learning" scikit-learn statsmodels imbalanced-learn xgboost lightgbm shap
    pip_group "databases, ETL and data quality" \
        sqlalchemy psycopg2-binary duckdb redis great-expectations pandera \
        faker joblib tqdm python-dotenv pyyaml click rich typer requests httpx
    pip_group "Jupyter, MLflow, DVC" jupyterlab notebook ipykernel ipywidgets mlflow dvc
    pip_group "web services and UIs" fastapi "uvicorn[standard]" gunicorn flask streamlit gradio pydantic
    pip_group "testing and code quality" \
        pytest pytest-cov black ruff flake8 mypy pre-commit locust prometheus-client
    pip_group "cloud SDKs and automation" \
        boto3 azure-storage-blob azure-identity google-cloud-storage docker kubernetes \
        paramiko fabric ansible-core

    "$LAB_VENV/bin/python" -m ipykernel install --sys-prefix --name lab --display-name "Lab (Python venv)" \
        || warn "Jupyter kernel 'lab' could not be registered"
    "$LAB_VENV/bin/python" -m ipykernel install --sys-prefix --name mbbo205 --display-name "MBBO205 (venv)" >/dev/null 2>&1 || true
    chown -R "$LAB_USER":"$LAB_USER" "$LAB_VENV" 2>/dev/null || true
    apt-get clean
    require_files "$LAB_VENV/bin/python"
    "$LAB_VENV/bin/python" -c 'import numpy, pandas, sklearn, matplotlib, sqlalchemy' >/dev/null 2>&1 \
        || CRITICAL+=("python:data-libraries")
}

mod_ai() {
    step "PyTorch (CPU), Hugging Face, RAG and NLP libraries"
    PIP="$LAB_VENV/bin/pip"
    [[ -x "$PIP" ]] || { fail_item "ai:no-venv"; return 0; }
    if [[ "$ARCH" == "amd64" && -n "$LAB_TORCH_INDEX" ]]; then
        "$PIP" install --retries 10 --timeout 60 torch torchvision torchaudio --index-url "$LAB_TORCH_INDEX" \
            || fail_item "pip:torch"
    else
        "$PIP" install --retries 10 --timeout 60 torch torchvision torchaudio || fail_item "pip:torch"
    fi
    # Without torch these packages would pull the multi-GB CUDA build from PyPI; skip them instead.
    if "$LAB_VENV/bin/python" -c 'import torch' >/dev/null 2>&1; then
        pip_group "Hugging Face" transformers datasets tokenizers accelerate evaluate huggingface_hub \
            sentence-transformers onnx onnxruntime optimum
    else
        warn "torch is missing: skipping sentence-transformers, accelerate and optimum"
        pip_group "Hugging Face (without torch)" transformers datasets tokenizers evaluate huggingface_hub onnx onnxruntime
    fi
    pip_group "RAG (vector search, LangChain)" \
        faiss-cpu chromadb rank-bm25 langchain langchain-community langchain-text-splitters \
        pypdf python-docx tiktoken
    pip_group "NLP" nltk spacy
    "$LAB_VENV/bin/python" -m nltk.downloader -d /usr/share/nltk_data punkt punkt_tab stopwords >/dev/null 2>&1 \
        || warn "NLTK data could not be downloaded"
    "$LAB_VENV/bin/python" -m spacy download en_core_web_sm >/dev/null 2>&1 \
        || warn "spaCy model en_core_web_sm could not be downloaded"
    if ! "$PIP" check > /var/log/lab_pip_check.log 2>&1; then
        warn "pip check reports conflicts (see /var/log/lab_pip_check.log)"
        head -n 20 /var/log/lab_pip_check.log
    fi
    chown -R "$LAB_USER":"$LAB_USER" "$LAB_VENV" 2>/dev/null || true
    "$LAB_VENV/bin/python" -c 'import torch, transformers' >/dev/null 2>&1 || CRITICAL+=("python:torch-transformers")
}

ollama_unit_ensure() {   # Ollama's installer enables its unit only while systemd is "running" (not in a first-boot image build) and skips it on WSL 2
    (( HAS_SYSTEMD )) || return 0
    have ollama || return 0
    if ! systemctl cat ollama.service >/dev/null 2>&1; then
        log "Ollama's installer left no systemd unit; creating ollama.service"
        id ollama >/dev/null 2>&1 || useradd -r -s /bin/false -U -m -d /usr/share/ollama ollama
        cat > /etc/systemd/system/ollama.service <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=$(command -v ollama) serve
User=ollama
Group=ollama
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF
        systemctl daemon-reload >/dev/null 2>&1 || true
    fi
    if [[ "$LAB_IMAGE_BUILD" == "1" ]] && (( ! IN_WSL && ! IN_CONTAINER )); then
        # In the VM image the host reaches Ollama through a VirtualBox NAT port forward (127.0.0.1:11434 on the host).
        # That forward connects to the guest's own address, not to its loopback, and Ollama listens on 127.0.0.1 only
        # unless told otherwise. (WSL's localhost relay needs no change, so a WSL installation keeps the default.)
        install -d /etc/systemd/system/ollama.service.d
        printf '[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\n' > /etc/systemd/system/ollama.service.d/lab.conf
        systemctl daemon-reload >/dev/null 2>&1 || true
    fi
    svc_enable ollama   # enabled at boot; started now unless an image is being built
}

mod_ollama() {
    step "Ollama (local LLM runtime)"
    if ! have ollama; then
        curl -fsSL --retry 3 https://ollama.com/install.sh | sh || fail_item "ollama"
    fi
    ollama_unit_ensure
    if [[ -x "$LAB_VENV/bin/pip" ]]; then
        PIP="$LAB_VENV/bin/pip"
        pip_group "Ollama Python client" ollama
    fi
    have ollama || CRITICAL+=("command:ollama")
}

mod_cloud() {
    step "Cloud CLIs: AWS CLI v2, Azure CLI, Google Cloud CLI, Terraform"
    local tmp awsarch
    tmp="$(mktemp -d)"
    if ! have aws; then
        case "$(uname -m)" in aarch64) awsarch=aarch64 ;; *) awsarch=x86_64 ;; esac
        { curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${awsarch}.zip" -o "$tmp/awscliv2.zip" \
            && unzip -q "$tmp/awscliv2.zip" -d "$tmp" && "$tmp/aws/install" --update; } || fail_item "aws-cli"
    fi
    if ! have az; then
        { curl -fsSL https://aka.ms/InstallAzureCLIDeb | bash; } || fail_item "azure-cli"
    fi
    if ! have gcloud; then
        {
            curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
                && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
                    > /etc/apt/sources.list.d/google-cloud-sdk.list \
                && apt_update && apt_get install google-cloud-cli
        } || fail_item "google-cloud-cli"
    fi
    if ! have terraform; then
        {
            curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp.gpg \
                && echo "deb [signed-by=/usr/share/keyrings/hashicorp.gpg] https://apt.releases.hashicorp.com ${CODENAME} main" \
                    > /etc/apt/sources.list.d/hashicorp.list \
                && apt_update && apt_get install terraform
        } || fail_item "terraform"
    fi
    rm -rf "$tmp"
    apt-get clean
}

mod_k8s() {
    step "Kubernetes tools: kubectl, kind, helm"
    local tmp kver
    tmp="$(mktemp -d)"
    {
        kver="$(curl -fsSL https://dl.k8s.io/release/stable.txt)" \
            && curl -fsSL "https://dl.k8s.io/release/${kver}/bin/linux/${ARCH}/kubectl" -o "$tmp/kubectl" \
            && install -m 0755 "$tmp/kubectl" /usr/local/bin/kubectl
    } || fail_item "kubectl"
    {
        curl -fsSL "https://kind.sigs.k8s.io/dl/latest/kind-linux-${ARCH}" -o "$tmp/kind" \
            && install -m 0755 "$tmp/kind" /usr/local/bin/kind
    } || fail_item "kind"
    { curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash; } || fail_item "helm"
    rm -rf "$tmp"
}

mod_latex() {
    step "XeLaTeX (course notes and reports)"
    apt_install texlive-xetex texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra \
        texlive-lang-european texlive-science fonts-dejavu fonts-liberation latexmk
    apt-get clean
}

mod_models() {
    step "Ollama models: $LAB_OLLAMA_MODELS"
    have ollama || { fail_item "models:no-ollama"; return 0; }
    if (( HAS_SYSTEMD )); then systemctl start ollama >/dev/null 2>&1 || true; fi
    local m
    for _ in $(seq 1 30); do ollama list >/dev/null 2>&1 && break; sleep 2; done
    for m in $LAB_OLLAMA_MODELS; do
        ollama pull "$m" || fail_item "ollama-model:$m"
    done
}

mod_courses() {
    step "Course setup scripts"
    local f name rc ran=0
    install -d /var/lib/lab_course
    # Course scripts read their data files (e.g. opsys-code.tar.gz) from /opt/lab/courses; a run from another kit
    # folder (by hand on a bare machine) copies them there first.
    if [[ -d "$LAB_COURSE_DIR" && "$(readlink -f "$LAB_COURSE_DIR")" != /opt/lab/courses ]]; then
        install -d /opt/lab/courses
        (cd "$LAB_COURSE_DIR" && find . -type f ! -name '*.sh' -exec cp -a --parents -t /opt/lab/courses {} +) || warn "could not copy the course data files to /opt/lab/courses"
    fi
    shopt -s nullglob
    for f in "$LAB_COURSE_DIR"/*.sh; do
        name="$(basename "$f" .sh)"
        # A course script runs once: a second run of this installer must not recreate (and so wipe) e.g. ~/lab.
        if [[ "${LAB_COURSE_FORCE:-0}" != 1 && "$(cat "/var/lib/lab_course/$name.status" 2>/dev/null)" == 0 ]]; then
            echo "Course script $name already ran successfully - skipped (LAB_COURSE_FORCE=1 runs it again)"
            ran=$((ran + 1))
            continue
        fi
        if [[ "$(dirname "$(readlink -f "$f")")" != /opt/lab/courses ]]; then
            install -d /opt/lab/courses
            install -m 755 "$f" "/opt/lab/courses/$name.sh"
            f="/opt/lab/courses/$name.sh"
        fi
        echo "Running $name as $LAB_USER"
        as_user bash "$f"
        rc=$?
        echo "$rc" > "/var/lib/lab_course/$name.status"
        if (( rc != 0 )); then warn "course script $name exited with status $rc"; FAILED+=("course:$name"); fi
        ran=$((ran + 1))
    done
    shopt -u nullglob
    (( ran )) || echo "No course scripts found in $LAB_COURSE_DIR (put *.sh files there to have them run)."
}

install_helpers() {
    install -d /etc/lab
    cat > /etc/lab/env <<EOF
LABVM_VERSION="$LABVM_VERSION"
LAB_USER="$LAB_USER"
LAB_PROFILE="$LAB_PROFILE"
LAB_GUI="$LAB_GUI"
LAB_VENV="$LAB_VENV"
LAB_EXTRAS="$LAB_EXTRAS"
LAB_KEYMAP="$LAB_KEYMAP"
LAB_SKIP_DOCKER="$LAB_SKIP_DOCKER"
LAB_SKIP_OLLAMA="$LAB_SKIP_OLLAMA"
LAB_SKIP_TORCH="$LAB_SKIP_TORCH"
LAB_SSH_PASSWORD_AUTH="$LAB_SSH_PASSWORD_AUTH"
LAB_SSH="$ENABLE_SSH"
LAB_IN_CONTAINER="$IN_CONTAINER"
LAB_IN_WSL="$IN_WSL"
LAB_WSL_SERVICES="$LAB_WSL_SERVICES"
LAB_INSTALLED="$(date '+%F %T')"
EOF

    cat > /usr/local/bin/lab-keyboard <<'EOF'
#!/bin/bash
# lab-keyboard us|tr|us,tr  - set the keyboard layout of the console and the desktop (persistent)
set -eu
layout="${1:-}"
case "$layout" in us|tr|us,tr|tr,us) ;; *) echo "usage: lab-keyboard us|tr|us,tr   (us,tr: Alt+Shift switches)"; exit 1 ;; esac
opts=""
case "$layout" in *,*) opts="grp:alt_shift_toggle" ;; esac
if [ "$(id -u)" -ne 0 ]; then
    if [ -n "${DISPLAY:-}" ] && command -v setxkbmap >/dev/null 2>&1; then setxkbmap -layout "$layout" -option "$opts" || true; fi
    exec sudo "$0" "$@"
fi
cat > /etc/default/keyboard <<EOT
XKBMODEL="pc105"
XKBLAYOUT="$layout"
XKBVARIANT=""
XKBOPTIONS="$opts"
BACKSPACE="guess"
EOT
install -d /etc/X11/xorg.conf.d
cat > /etc/X11/xorg.conf.d/00-keyboard.conf <<EOT
Section "InputClass"
        Identifier "system-keyboard"
        MatchIsKeyboard "on"
        Option "XkbLayout" "$layout"
        Option "XkbModel" "pc105"
        Option "XkbOptions" "$opts"
EndSection
EOT
setupcon --save-only >/dev/null 2>&1 || setupcon >/dev/null 2>&1 || true
echo "Keyboard layout set to: $layout"
EOF

    cat > /usr/local/bin/lab-jupyter <<'EOF'
#!/bin/bash
# lab-jupyter [directory]  - start JupyterLab from the lab virtual environment (token: lab)
# shellcheck disable=SC1091
. /etc/lab/env 2>/dev/null || true
venv="${LAB_VENV:-/opt/lab/venv}"
[ -x "$venv/bin/jupyter" ] || { echo "JupyterLab is not installed (profile ai needed)"; exit 1; }
cd "${1:-$HOME}" || exit 1
echo "Open http://127.0.0.1:8888/lab?token=${JUPYTER_TOKEN:-lab} (inside the VM, or on the host when the port is forwarded)"
exec "$venv/bin/jupyter" lab --ip=0.0.0.0 --port=8888 --no-browser --ServerApp.token="${JUPYTER_TOKEN:-lab}"
EOF

    cat > /usr/local/bin/lab-mlflow <<'EOF'
#!/bin/bash
# lab-mlflow [directory]  - start the MLflow tracking server (UI: port 5000) from the lab virtual environment
# shellcheck disable=SC1091
. /etc/lab/env 2>/dev/null || true
venv="${LAB_VENV:-/opt/lab/venv}"
[ -x "$venv/bin/mlflow" ] || { echo "MLflow is not installed (profile ai needed)"; exit 1; }
dir="${1:-$HOME/mlflow}"
mkdir -p "$dir/artifacts"
echo "MLflow UI: http://127.0.0.1:5000   (data in $dir)"
exec "$venv/bin/mlflow" server --host 0.0.0.0 --port 5000 \
    --backend-store-uri "sqlite:///$dir/mlflow.db" --default-artifact-root "$dir/artifacts"
EOF

    cat > /usr/local/bin/lab-info <<'EOF'
#!/bin/bash
# lab-info  - short overview of this lab machine
# shellcheck disable=SC1091
. /etc/lab/env 2>/dev/null || true
echo "LabVM ${LABVM_VERSION:-?}  profile=${LAB_PROFILE:-?}  desktop=${LAB_GUI:-?}  installed=${LAB_INSTALLED:-?}"
echo "Host      : $(hostname)"
echo "Address   : $(hostname -I 2>/dev/null | awk '{print $1}')"
echo "Account   : ${LAB_USER:-?}"
echo "Python    : ${LAB_VENV:-/opt/lab/venv}   (activate: lab-venv)"
[ -d "$HOME/opsys" ] && echo "OS course : ~/opsys   (MCMP117 / MBLP131 code, Weeks 2-15; practice folder ~/lab)"
for s in ssh docker nginx postgresql redis-server ollama lightdm; do
    if systemctl cat "$s" >/dev/null 2>&1; then printf '  %-14s %s\n' "$s" "$(systemctl is-active "$s" 2>/dev/null)"; fi
done
echo "Commands  : verify_lab  lab-jupyter  lab-mlflow  lab-keyboard us|tr|us,tr  lab-info"
EOF
    chmod 755 /usr/local/bin/lab-keyboard /usr/local/bin/lab-jupyter /usr/local/bin/lab-mlflow /usr/local/bin/lab-info
    if [[ -f "$SELF_DIR/verify_lab.sh" ]]; then
        install -m 755 "$SELF_DIR/verify_lab.sh" /usr/local/bin/verify_lab
    fi
}

mod_userenv() {
    step "User environment: shell defaults, Docker stack, launchers"
    install_helpers
    local home mark brc
    home="$(getent passwd "$LAB_USER" | cut -d: -f6)"
    [[ -n "$home" && -d "$home" ]] || { warn "home directory of $LAB_USER not found"; return 0; }

    # shell defaults
    brc="$home/.bashrc"
    mark="# >>> lab defaults >>>"
    if ! grep -qF "$mark" "$brc" 2>/dev/null; then
        cat >> "$brc" <<EOF

# >>> lab defaults >>>
export EDITOR=vim
export HISTSIZE=10000
export HISTCONTROL=ignoredups
export PATH="\$HOME/.local/bin:\$PATH"
export NLTK_DATA=/usr/share/nltk_data
alias ll='ls -alFh'
alias grep='grep --color=auto'
alias lab-venv='source $LAB_VENV/bin/activate'
alias mbbo='source $LAB_VENV/bin/activate'
alias dps='docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"'
# <<< lab defaults <<<
EOF
        chown "$LAB_USER":"$LAB_USER" "$brc"
    fi

    # WSL: no SSH step, but gdb and strace still need ptrace; Windows Explorer is one alias away (PATH holds no Windows folders)
    if (( IN_WSL )); then
        if [[ "$ENABLE_SSH" != "1" ]]; then write_lab_sysctl; fi
        if ! grep -qF "# >>> lab wsl >>>" "$brc" 2>/dev/null; then
            cat >> "$brc" <<'EOF'

# >>> lab wsl >>>
alias explorer='/mnt/c/Windows/explorer.exe'   # "explorer ." opens the current folder in Windows Explorer
# <<< lab wsl <<<
EOF
            chown "$LAB_USER":"$LAB_USER" "$brc"
        fi
    fi

    # git defaults for every account
    git config --system init.defaultBranch main
    git config --system pull.rebase false
    git config --system core.autocrlf input
    git config --system core.editor vim
    git config --system color.ui auto
    git config --system alias.lg "log --oneline --graph --decorate --all"

    # Docker / compose assets (Dockerfile, docker-compose.yml, ...)
    if [[ -d "$LAB_DOCKER_ASSETS" ]] && compgen -G "$LAB_DOCKER_ASSETS/*" >/dev/null; then
        install -d -o "$LAB_USER" -g "$LAB_USER" "$home/labstack"
        # The kit files are refreshed on every run. work/ holds the student's own files (the nginx container serves
        # work/nginx/html), so files in there are only added when they are missing - a repair run must not overwrite them.
        tar -C "$LAB_DOCKER_ASSETS" --exclude=./work -cf - . | tar -C "$home/labstack" -xf -
        install -d "$home/labstack/work"
        if [[ -d "$LAB_DOCKER_ASSETS/work" ]]; then
            cp -a -n "$LAB_DOCKER_ASSETS/work/." "$home/labstack/work/" 2>/dev/null || true
        fi
        if [[ -f "$home/labstack/.env.example" && ! -f "$home/labstack/.env" ]]; then
            cp "$home/labstack/.env.example" "$home/labstack/.env"
        fi
        if [[ -f "$home/labstack/.env" ]]; then
            # build context of the optional lab container = the folder that holds this installer
            grep -q '^LAB_KIT_DIR=' "$home/labstack/.env" || printf 'LAB_KIT_DIR=%s\n' "$SELF_DIR" >> "$home/labstack/.env"
            if getent group docker >/dev/null && ! grep -q '^DOCKER_GID=' "$home/labstack/.env"; then
                printf 'DOCKER_GID=%s\n' "$(getent group docker | cut -d: -f3)" >> "$home/labstack/.env"
            fi
            # PostgreSQL and Redis are installed as system services on this machine (devops profile and up); they listen on
            # 5432 / 6379, so the containers of the compose stack are published on other ports (docker/README.md).
            if (( LEVEL >= 3 && ! IN_CONTAINER )); then
                grep -q '^POSTGRES_PORT=' "$home/labstack/.env" || printf 'POSTGRES_PORT=15432\n' >> "$home/labstack/.env"
                grep -q '^REDIS_PORT=' "$home/labstack/.env" || printf 'REDIS_PORT=16379\n' >> "$home/labstack/.env"
            fi
        fi
        chown -R "$LAB_USER":"$LAB_USER" "$home/labstack"
    fi

    # menu entry for JupyterLab (desktop only)
    if [[ "$LAB_GUI" == "1" && -x "$LAB_VENV/bin/jupyter" ]]; then
        cat > /usr/share/applications/lab-jupyter.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=JupyterLab (lab venv)
Comment=Start JupyterLab and open it in the browser
Exec=xfce4-terminal --title=JupyterLab -e "bash -c 'lab-jupyter; read -p Press-Enter'"
Icon=utilities-terminal
Terminal=false
Categories=Development;
EOF
    fi
    # ownership of everything we created under the home directory
    chown "$LAB_USER":"$LAB_USER" "$home" 2>/dev/null || true
}

mod_finish() {
    step "Cleaning up and verifying"
    policy_release
    apt_get autoremove >/dev/null 2>&1 || true
    apt-get clean
    rm -f /root/.bash_history

    echo
    echo "=========================== Summary ==========================="
    local t
    for t in bash gcc gdb strace valgrind git vim tmux jq python3 docker nginx psql ollama; do
        if have "$t"; then printf '  %-12s %s\n' "$t" "$(command -v "$t")"; else printf '  %-12s -\n' "$t"; fi
    done
    if [[ -x "$LAB_VENV/bin/python" ]]; then
        "$LAB_VENV/bin/python" - <<'PY'
import importlib
for m in ["numpy", "pandas", "sklearn", "matplotlib", "sqlalchemy", "mlflow", "fastapi", "streamlit",
          "torch", "transformers", "sentence_transformers", "faiss", "chromadb", "boto3"]:
    try:
        mod = importlib.import_module(m)
        print("  %-22s %s" % (m, getattr(mod, "__version__", "ok")))
    except Exception as e:
        print("  %-22s missing (%s)" % (m, type(e).__name__))
PY
    fi
    echo "================================================================"

    install -d /var/lib
    if (( ${#FAILED[@]} )); then
        printf '%s\n' "${FAILED[@]}" > /var/lib/lab_install.failed
        warn "${#FAILED[@]} item(s) could not be installed: ${FAILED[*]}"
        con "warn ${#FAILED[@]} item(s) missing: ${FAILED[*]}"
    else
        rm -f /var/lib/lab_install.failed
        echo "No failed items."
    fi
    if (( ${#CRITICAL[@]} )); then
        warn "essential parts are missing: ${CRITICAL[*]}"
        con "critical ${CRITICAL[*]}"
        return 1
    fi
    if [[ "$LAB_STRICT" == "1" ]] && (( ${#FAILED[@]} )); then
        warn "LAB_STRICT=1: failing because of the items above"
        return 1
    fi
    date '+%F %T' > /var/lib/lab_install.done
    echo "Done in $(( ($(date +%s) - START_TS) / 60 )) minutes. Log: $LAB_LOG"
    if [[ "$LAB_IMAGE_BUILD" != "1" ]]; then
        if (( IN_WSL )); then
            echo "Restart the distribution (in Windows: wsl --terminate ${WSL_DISTRO_NAME:-<name>}) so that the docker group and the locale apply."
        else
            echo "Log out and in again (docker group, locale); reboot is recommended after the first run."
        fi
    fi
    return 0
}

# ====================================================================== main
if [[ -n "$ONLY" ]]; then   # testing: run exactly the named modules, whatever the profile says
    IFS=, read -r -a PLAN <<< "$ONLY"
    for m in "${PLAN[@]}"; do declare -F "mod_$m" >/dev/null || die "unknown module '$m'"; done
    TOTAL=${#PLAN[@]}
fi
log "LabVM $LABVM_VERSION | $PRETTY_NAME | arch $ARCH | container=$IN_CONTAINER wsl=$IN_WSL systemd=$HAS_SYSTEMD"
log "profile=$LAB_PROFILE gui=$LAB_GUI autologin=${LAB_AUTOLOGIN:-0} extras=${LAB_EXTRAS:-none} user=$LAB_USER keymap=$LAB_KEYMAP image-build=$LAB_IMAGE_BUILD"
log "modules: ${PLAN[*]}"
con "install started: profile=$LAB_PROFILE gui=$LAB_GUI extras=${LAB_EXTRAS:-none} (${TOTAL} steps)"

if ! id "$LAB_USER" >/dev/null 2>&1; then
    log "creating user $LAB_USER (set a password with: sudo passwd $LAB_USER)"
    adduser --disabled-password --gecos "" "$LAB_USER" || die "cannot create user $LAB_USER"
fi
if ! ping -c1 -W3 archive.ubuntu.com >/dev/null 2>&1; then
    warn "archive.ubuntu.com does not answer ping (may just be filtered); package downloads will show whether the network works"
fi

policy_block
rc=0
for m in "${PLAN[@]}"; do
    "mod_$m"
    mrc=$?
    if [[ "$m" == finish ]]; then
        rc=$mrc
    elif (( mrc != 0 )); then
        warn "module '$m' returned status $mrc"
    fi
done
policy_release
if (( rc != 0 )); then
    con "install failed (essential parts missing, see /var/log/lab_install.log)"
    exit "$rc"
fi
con "install finished"
exit 0
