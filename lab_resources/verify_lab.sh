#!/usr/bin/env bash
# =============================================================================
# LabVM - acceptance test for a lab machine.
#   verify_lab          run every check that applies to the installed profile
#   verify_lab -q       print only failures and the result
# Exit status 0 = all checks passed. Installed in the VM as /usr/local/bin/verify_lab.
# =============================================================================
# shellcheck disable=SC2016  # the single-quoted snippets run inside bash -c on purpose
quiet=0
[ "${1:-}" = "-q" ] && quiet=1
# A caller without a login environment (cloud-init, systemd, cron) may not set HOME, and ollama refuses to start without it.
if [ -z "${HOME:-}" ]; then
    HOME="$(getent passwd "$(id -u)" | cut -d: -f6)"
    export HOME
fi
# LAB_VERIFY_BUILD=1: run by the image build inside the temporary build VM; the checks that only make sense on a
# deployed copy (unique hostname, running Docker daemon) are skipped there.
build_phase="${LAB_VERIFY_BUILD:-0}"

pass=0
fail=0
skipped=0

# shellcheck disable=SC1091
. /etc/lab/env 2>/dev/null || true
profile="${LAB_PROFILE:-core}"
gui="${LAB_GUI:-0}"
venv="${LAB_VENV:-/opt/lab/venv}"
lab_user="${LAB_USER:-user}"
container="${LAB_IN_CONTAINER:-0}"   # 1: installed into a container image (no sshd, no systemd services, host kernel)
wsl="${LAB_IN_WSL:-0}"                # 1: Windows Subsystem for Linux (no sshd, no desktop; services off until started)
wsl_services="${LAB_WSL_SERVICES:-0}"
ssh_wanted="${LAB_SSH:-1}"
case "$profile" in core) level=1 ;; full) level=2 ;; devops) level=3 ;; ai) level=4 ;; all) level=5 ;; *) level=1 ;; esac

say() { [ "$quiet" -eq 1 ] || printf '%s\n' "$*"; }

check() {   # check "description" command [args...]
    local desc=$1
    shift
    if "$@" >/dev/null 2>&1; then
        [ "$quiet" -eq 1 ] || printf '  [ OK ] %s\n' "$desc"
        pass=$((pass + 1))
    else
        printf '  [FAIL] %s\n' "$desc"
        fail=$((fail + 1))
    fi
}

skip() {
    [ "$quiet" -eq 1 ] || printf '  [SKIP] %s\n' "$1"
    skipped=$((skipped + 1))
}

py_import() { "$venv/bin/python" -c "import $1" ; }

# Does sshd accept password logins? Ask sshd itself (root, host keys and /run/sshd are needed for "sshd -T");
# otherwise read the files: sshd takes the first value it finds, and sshd_config.d is included first.
ssh_password_login() {
    local out=""
    if [ "$(id -u)" -eq 0 ]; then
        mkdir -p /run/sshd 2>/dev/null
        out="$(sshd -T 2>/dev/null)"
    elif sudo -n true 2>/dev/null; then
        out="$(sudo -n sh -c 'mkdir -p /run/sshd; sshd -T' 2>/dev/null)"
    fi
    if [ -n "$out" ]; then
        printf '%s\n' "$out" | grep -qi '^passwordauthentication yes'
        return
    fi
    cat /etc/ssh/sshd_config.d/*.conf /etc/ssh/sshd_config 2>/dev/null \
        | grep -i '^[[:space:]]*passwordauthentication' | head -n 1 | grep -qi 'yes'
}

say "LabVM verification - host $(hostname), kernel $(uname -r), hypervisor $(systemd-detect-virt 2>/dev/null || echo unknown)"
say "Profile: $profile   desktop: $gui   CPUs: $(nproc)   memory: $(awk '/MemTotal/ {printf "%.1f GB", $2/1048576}' /proc/meminfo)"
say

say "Commands (core)"
for t in bash gcc make gdb strace vim nano tmux htop bc jq tree git python3 man ps top kill lsof rsync curl wget; do
    check "$t" command -v "$t"
done

if [ "$level" -ge 2 ]; then
    say
    say "Commands (full)"
    for t in g++ cmake valgrind ltrace shellcheck stress-ng; do check "$t" command -v "$t"; done
fi

say
say "System"
check "manual pages installed"                 test -e /usr/share/man/man1/ls.1.gz
check "man finds a page (man -w ls)"           man -w ls
check "user '$lab_user' exists"                id "$lab_user"
if [ "$ssh_wanted" = "1" ] && [ "$container" != "1" ]; then
    check "ssh service enabled"                systemctl is-enabled ssh
    check "ssh host keys present"              bash -c 'ls /etc/ssh/ssh_host_*_key'
    if [ "${LAB_SSH_PASSWORD_AUTH:-0}" = "1" ]; then
        check "ssh offers password login"      ssh_password_login
    else
        skip "ssh password login (not requested at install time: LAB_SSH_PASSWORD_AUTH=1)"
    fi
else
    skip "ssh server (not part of this installation)"
fi
if [ "$container" = "1" ]; then
    skip "default route and DNS (the container platform manages the network)"
else
    check "default route present"              bash -c 'ip route | grep -q "^default"'
    check "DNS resolves archive.ubuntu.com"    getent hosts archive.ubuntu.com
fi
check "locale en_US.UTF-8 available"           bash -c 'locale -a | grep -qi "^en_US\.utf-\?8$"'
check "locale tr_TR.UTF-8 available"           bash -c 'locale -a | grep -qi "^tr_TR\.utf-\?8$"'
if [ "$container" = "1" ]; then
    skip "ptrace_scope (a kernel setting of the container host)"
else
    check "ptrace_scope = 0 (gdb/strace)"      bash -c '[ ! -e /proc/sys/kernel/yama/ptrace_scope ] || [ "$(cat /proc/sys/kernel/yama/ptrace_scope)" = 0 ]'
fi
check "at least 1 GiB free on /"               bash -c '[ "$(df --output=avail -k / | tail -n 1)" -ge 1048576 ]'
if [ "$container" = "1" ]; then
    skip "hostname and machine-id (containers get theirs from the container platform)"
elif [ "$build_phase" = "1" ]; then
    skip "unique hostname (assigned on the first boot of each deployed copy)"
    check "machine-id is set"                  bash -c '[ -s /etc/machine-id ]'
else
    check "hostname is unique (not the build default)" bash -c '[ "$(hostname)" != "labvm" ]'
    check "machine-id is set"                  bash -c '[ -s /etc/machine-id ]'
fi

if [ "$level" -ge 3 ]; then
    say
    say "Docker and services (devops)"
    if [ "${LAB_SKIP_DOCKER:-0}" != "1" ]; then
        check "docker client"                  docker --version
        check "docker compose plugin"          docker compose version
        check "docker service enabled"         systemctl is-enabled docker
        if [ "$build_phase" = "1" ]; then
            skip "docker daemon (stopped at the end of the image build; starts on the deployed copy)"
        else
            check "docker daemon answers"      docker info
        fi
        check "'$lab_user' is in the docker group" bash -c "id -nG '$lab_user' | tr ' ' '\n' | grep -qx docker"
    else
        skip "Docker was not installed (--skip-docker)"
    fi
    for t in nginx psql redis-cli nmap tcpdump rg sqlite3 ab; do check "$t" command -v "$t"; done
    if [ "$container" = "1" ]; then
        skip "system services nginx, postgresql, redis-server (start them yourself or use docker compose)"
    elif [ "$wsl" = "1" ] && [ "$wsl_services" != "1" ]; then
        for s in nginx postgresql redis-server; do check "service $s installed (off until started: sudo systemctl start $s)" systemctl cat "$s"; done
    else
        for s in nginx postgresql redis-server; do check "service $s enabled" systemctl is-enabled "$s"; done
    fi
fi

if [ "$level" -ge 4 ]; then
    say
    say "Python and AI (ai)"
    if [ -x "$venv/bin/python" ]; then
        check "virtual environment $venv"      test -x "$venv/bin/python"
        for m in numpy pandas sklearn matplotlib sqlalchemy mlflow fastapi streamlit jupyterlab; do
            check "python: import $m"          py_import "$m"
        done
        if [ "${LAB_SKIP_TORCH:-0}" = "1" ]; then
            skip "AI libraries were not installed (--skip-torch)"
        else
            for m in torch transformers sentence_transformers faiss chromadb; do
                check "python: import $m"      py_import "$m"
            done
        fi
        check "Jupyter kernel 'lab' registered" bash -c "ls '$venv/share/jupyter/kernels' | grep -qx lab"
    else
        printf '  [FAIL] virtual environment %s is missing\n' "$venv"
        fail=$((fail + 1))
    fi
    if [ "${LAB_SKIP_OLLAMA:-0}" != "1" ]; then
        check "ollama" ollama --version
        if [ "$container" != "1" ] && [ -d /run/systemd/system ] && systemctl cat ollama.service >/dev/null 2>&1; then
            check "ollama service enabled" systemctl is-enabled ollama
            # In the VirtualBox image the host reaches Ollama through a NAT port forward, which needs a listener on the
            # guest's own address (checked only while the service runs; it is not running during the image build).
            if [ "$wsl" != "1" ] && systemctl is-active --quiet ollama 2>/dev/null && systemd-detect-virt 2>/dev/null | grep -qx oracle; then
                check "ollama listens on all addresses (VirtualBox port forward)" bash -c "ss -ltnH 'sport = :11434' | grep -Eq '(\\*|0\\.0\\.0\\.0|\\[::\\]):11434'"
            fi
        fi
    else
        skip "Ollama was not installed (--skip-ollama)"
    fi
fi

if [ "$gui" = "1" ]; then
    say
    say "Desktop"
    for t in lightdm xfce4-session xfce4-panel xfwm4 xfce4-terminal thunar mousepad Xorg; do check "$t" command -v "$t"; done
    check "Xfce session file"                  test -e /usr/share/xsessions/xfce.desktop
    check "boots to graphical.target"          bash -c '[ "$(systemctl get-default)" = graphical.target ] || [ "$(readlink -f /etc/systemd/system/default.target)" = "$(readlink -f /lib/systemd/system/graphical.target)" ]'
    check "display manager enabled"            bash -c 'systemctl is-enabled lightdm || [ -e /etc/systemd/system/display-manager.service ]'
    if systemd-detect-virt 2>/dev/null | grep -qx oracle; then
        check "VirtualBox guest utilities"     command -v VBoxClient
        check "VirtualBox X11 integration"     dpkg -s virtualbox-guest-x11
    fi
fi

if compgen -G "/var/lib/lab_course/*.status" >/dev/null; then
    say
    say "Course setup scripts"
    for f in /var/lib/lab_course/*.status; do
        n="$(basename "$f" .status)"
        check "course script $n finished with status 0" grep -qx 0 "$f"
    done
fi

if [ -f /var/lib/lab_course/opsys_code.status ]; then
    say
    say "Operating-systems course code base (MCMP117 / MBLP131)"
    opsys_home="$(getent passwd "$lab_user" | cut -d: -f6)"
    opsys_present() { [ -f "$opsys_home/opsys/README.md" ] && [ -f "$opsys_home/opsys/MCMP117/Week_15/passfail.sh" ] && [ -f "$opsys_home/opsys/MBLP131/Hafta_15/passfail.sh" ]; }
    opsys_compiles() {   # a Week 2 program builds with gcc and prints its message
        local d rc
        d="$(mktemp -d)" || return 1
        cp "$opsys_home/opsys/MCMP117/Week_02/hello_syscall.c" "$d/" && gcc -o "$d/hello" "$d/hello_syscall.c" 2>/dev/null && "$d/hello" | grep -q Hello
        rc=$?
        rm -rf "$d"
        return $rc
    }
    check "code base in $opsys_home/opsys (Weeks 2-15, English and Turkish)" opsys_present
    check "a Week 2 program compiles and runs" opsys_compiles
fi

if [ -s /var/lib/lab_install.failed ]; then
    say
    say "Items the installer could not install"
    while IFS= read -r item; do
        printf '  [FAIL] %s\n' "$item"
        fail=$((fail + 1))
    done < /var/lib/lab_install.failed
fi

echo
printf 'Result: %d passed, %d failed, %d skipped\n' "$pass" "$fail" "$skipped"
[ "$fail" -eq 0 ]
