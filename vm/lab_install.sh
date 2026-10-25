#!/usr/bin/env bash
# =============================================================================
# MCMP117 / MBLP131 - Lab machine installer (Ubuntu guest on VirtualBox/VMware)
#
# Usage (inside the Ubuntu VM):
#     chmod +x lab_install.sh
#     sudo ./lab_install.sh
#
# Optional environment variables:
#     LAB_USER=user            user that receives the lab folder (default: $SUDO_USER or "user")
#     LAB_SETUP_URL=<url>         URL of mcmp117_lab_setup.sh (downloaded and executed as LAB_USER)
#     LAB_SETUP_LOCAL=<path>      local path of mcmp117_lab_setup.sh (default: next to this script)
#     INSTALL_TR_LOCALE=1         also generate tr_TR.UTF-8 locale (default: 1)
#     SET_TR_KEYMAP=0             set Turkish Q keyboard layout (default: 0)
#     ENABLE_SSH=1                install and enable openssh-server (default: 1)
#     LAB_PROFILE=full            "core" = Linux/Bash practical + process demos only,
#                                 "full" = core + debugging/benchmark extras (default: full)
#
# The script is idempotent: it can be re-run safely on every lab machine.
# =============================================================================
set -euo pipefail

LOG=/var/log/lab_install.log
exec > >(tee -a "$LOG") 2>&1

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: run as root:  sudo ./lab_install.sh" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_USER="${LAB_USER:-${SUDO_USER:-user}}"
LAB_SETUP_URL="${LAB_SETUP_URL:-}"
LAB_SETUP_LOCAL="${LAB_SETUP_LOCAL:-$SCRIPT_DIR/mcmp117_lab_setup.sh}"
INSTALL_TR_LOCALE="${INSTALL_TR_LOCALE:-1}"
SET_TR_KEYMAP="${SET_TR_KEYMAP:-0}"
ENABLE_SSH="${ENABLE_SSH:-1}"
LAB_PROFILE="${LAB_PROFILE:-full}"

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

step() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------- 0. checks --
step "Checking system"
. /etc/os-release
echo "OS         : $PRETTY_NAME"
echo "Kernel     : $(uname -r)"
echo "Hypervisor : $(systemd-detect-virt 2>/dev/null || echo unknown)"
echo "Lab user   : $LAB_USER"
echo "Profile    : $LAB_PROFILE"

if ! ping -c1 -W3 archive.ubuntu.com >/dev/null 2>&1; then
    echo "WARNING: archive.ubuntu.com unreachable. Check the VM network adapter"
    echo "         (VirtualBox: NAT or Bridged; VMware: NAT) and re-run."
fi

# Create the lab user if it does not exist (password must be set afterwards)
if ! id "$LAB_USER" >/dev/null 2>&1; then
    step "Creating user $LAB_USER"
    adduser --disabled-password --gecos "" "$LAB_USER"
    echo "Set a password with:  sudo passwd $LAB_USER"
fi
LAB_HOME="$(getent passwd "$LAB_USER" | cut -d: -f6)"

# ------------------------------------------------------------ 1. apt update --
step "Updating package index and upgrading"
apt-get update -y
apt-get upgrade -y

# ------------------------------------------------------ 2. course packages --
step "Installing course packages"
# core: everything the Linux/Bash practical and the process/memory demos need
PKGS=(
    build-essential gcc make gdb strace
    manpages-dev man-db
    bash bash-completion coreutils findutils grep sed gawk diffutils
    less file tree bc jq zip unzip tar gzip bzip2 xz-utils rsync
    vim nano tmux
    procps psmisc lsof htop sysstat
    iproute2 net-tools iputils-ping dnsutils curl wget netcat-openbsd traceroute
    git ca-certificates gnupg
    python3
    locales
)
# full: additional debugging, benchmarking and quality-of-life tools
if [[ "$LAB_PROFILE" == "full" ]]; then
    PKGS+=(
        g++ cmake ltrace valgrind
        manpages-posix manpages-posix-dev
        shellcheck dos2unix pv moreutils screen
        iotop iftop stress-ng cpulimit util-linux linux-tools-generic
        software-properties-common python3-pip python3-venv
    )
fi
# Install what exists; do not abort the whole run on one unavailable package.
for p in "${PKGS[@]}"; do
    if ! apt-get install -y --no-install-recommends "$p" >/dev/null 2>&1; then
        echo "  [skip] $p (not available on $PRETTY_NAME)"
    else
        echo "  [ok]   $p"
    fi
done

# Server cloud images can ship without manual pages; the course relies on man(1).
if [[ ! -e /usr/share/man/man1/ls.1.gz ]] && command -v unminimize >/dev/null 2>&1; then
    step "Restoring manual pages (unminimize)"
    yes | unminimize || true
fi

# ----------------------------------------------------- 3. guest integration --
step "Installing guest integration for detected hypervisor"
HV="$(systemd-detect-virt 2>/dev/null || echo none)"
case "$HV" in
    oracle)   # VirtualBox
        # no recommends: avoids pulling DKMS and kernel headers into a minimal image
        apt-get install -y --no-install-recommends virtualbox-guest-utils || true
        # the X11 helper is only useful (and only installed) on systems with a display server
        if dpkg -s xserver-xorg-core >/dev/null 2>&1; then
            apt-get install -y --no-install-recommends virtualbox-guest-x11 || true
        fi
        usermod -aG vboxsf "$LAB_USER" 2>/dev/null || true
        ;;
    vmware)
        apt-get install -y --no-install-recommends open-vm-tools || true
        if dpkg -s xserver-xorg-core >/dev/null 2>&1; then
            apt-get install -y --no-install-recommends open-vm-tools-desktop || true
        fi
        ;;
    *)
        echo "Hypervisor '$HV': no guest tools installed."
        echo "If this is VirtualBox, insert Guest Additions CD and run its installer manually."
        ;;
esac

# ---------------------------------------------------------------- 4. locale --
step "Locale configuration"
if [[ "$INSTALL_TR_LOCALE" == "1" ]]; then
    locale-gen en_US.UTF-8 tr_TR.UTF-8
else
    locale-gen en_US.UTF-8
fi
update-locale LANG=en_US.UTF-8
if [[ "$SET_TR_KEYMAP" == "1" ]]; then
    localectl set-keymap tr 2>/dev/null || true
    localectl set-x11-keymap tr pc105 2>/dev/null || true
fi

# ---------------------------------------------------------------------- SSH --
if [[ "$ENABLE_SSH" == "1" ]]; then
    step "OpenSSH server"
    apt-get install -y openssh-server
    systemctl enable --now ssh
fi

# ------------------------------------------------ 5. kernel/ptrace settings --
step "Allowing ptrace for gdb/strace on own processes"
cat > /etc/sysctl.d/99-lab.conf <<'EOF'
kernel.yama.ptrace_scope = 0
EOF
sysctl --system >/dev/null || true

# ---------------------------------------------------- 6. lab folder (W9-14) --
step "Generating lab folder"
LAB_SCRIPT=""
if [[ -f "$LAB_SETUP_LOCAL" ]]; then
    LAB_SCRIPT="$LAB_SETUP_LOCAL"
elif [[ -n "$LAB_SETUP_URL" ]]; then
    LAB_SCRIPT="/tmp/mcmp117_lab_setup.sh"
    curl -fsSL "$LAB_SETUP_URL" -o "$LAB_SCRIPT"
fi

if [[ -n "$LAB_SCRIPT" ]]; then
    echo "Running $LAB_SCRIPT as $LAB_USER"
    install -m 755 "$LAB_SCRIPT" /opt/mcmp117_lab_setup.sh
    # A failure here must not abort the whole installation; the status is kept for verify_lab.sh.
    if sudo -u "$LAB_USER" -H bash /opt/mcmp117_lab_setup.sh; then
        echo 0 > /var/lib/lab_setup.status
    else
        rc=$?
        echo "$rc" > /var/lib/lab_setup.status
        echo "WARNING: mcmp117_lab_setup.sh exited with status $rc; the lab folder may be incomplete."
    fi
else
    echo "mcmp117_lab_setup.sh not found next to this script and LAB_SETUP_URL not set."
    echo "Place it beside lab_install.sh (or set LAB_SETUP_URL) and re-run to create the lab folder."
fi

# ------------------------------------------------------- 7. shell defaults --
step "Shell defaults for $LAB_USER"
BRC="$LAB_HOME/.bashrc"
MARK="# >>> lab defaults >>>"
if ! grep -qF "$MARK" "$BRC" 2>/dev/null; then
    cat >> "$BRC" <<'EOF'

# >>> lab defaults >>>
export EDITOR=vim
export HISTSIZE=10000
export HISTCONTROL=ignoredups
alias ll='ls -alF'
alias grep='grep --color=auto'
# <<< lab defaults <<<
EOF
    chown "$LAB_USER":"$LAB_USER" "$BRC"
fi

# ------------------------------------------------------------ 8. clean up ---
step "Cleaning up"
apt-get autoremove -y
apt-get clean

# ------------------------------------------------------------ 9. summary ----
step "Verification"
for t in gcc gdb valgrind strace ltrace make git vim tmux htop bc jq shellcheck python3; do
    if command -v "$t" >/dev/null 2>&1; then
        printf '  %-12s %s\n' "$t" "$(command -v "$t")"
    else
        printf '  %-12s MISSING\n' "$t"
    fi
done

echo
echo "Done. Log: $LOG"
echo "Reboot recommended (guest tools, group membership, locale):  sudo reboot"
