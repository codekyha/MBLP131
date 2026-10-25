#!/usr/bin/env bash
# =============================================================================
# MCMP117 / MBLP131 - acceptance test for a lab machine.
# Run inside the VM:   ./verify_lab.sh        (exit status 0 = all checks passed)
# =============================================================================
pass=0
fail=0

check() {   # check "description" command [args...]
    local desc=$1
    shift
    if "$@" >/dev/null 2>&1; then
        printf '  [ OK ] %s\n' "$desc"
        pass=$((pass + 1))
    else
        printf '  [FAIL] %s\n' "$desc"
        fail=$((fail + 1))
    fi
}

echo "Host: $(hostname)   Kernel: $(uname -r)   Hypervisor: $(systemd-detect-virt 2>/dev/null || echo unknown)"
echo

echo "Commands"
for t in bash gcc make gdb strace vim nano tmux htop bc jq tree git python3 man ps top kill lsof; do
    check "$t" command -v "$t"
done

echo
echo "System"
check "manual pages installed"             test -e /usr/share/man/man1/ls.1.gz
check "man finds a page (man -w ls)"       man -w ls
check "user 'user' exists"              id user
check "ssh service enabled"                systemctl is-enabled ssh
check "ssh host keys present"              bash -c 'ls /etc/ssh/ssh_host_*_key'
check "default route present"              bash -c 'ip route | grep -q "^default"'
check "DNS resolves archive.ubuntu.com"    getent hosts archive.ubuntu.com
check "locale en_US.UTF-8 available"       bash -c 'locale -a | grep -qi "^en_US\.utf-\?8$"'
check "locale tr_TR.UTF-8 available"       bash -c 'locale -a | grep -qi "^tr_TR\.utf-\?8$"'
check "ptrace_scope = 0 (gdb/strace)"      bash -c '[ "$(cat /proc/sys/kernel/yama/ptrace_scope)" = 0 ]'
check "at least 1 GiB free on /"           bash -c '[ "$(df --output=avail -k / | tail -n 1)" -ge 1048576 ]'
check "hostname is unique (not the build default)" bash -c '[ "$(hostname)" != "mcmp117-lab" ]'

if [ -r /var/lib/lab_setup.status ]; then
    echo
    echo "Course lab folder"
    check "mcmp117_lab_setup.sh finished with status 0" grep -qx 0 /var/lib/lab_setup.status
fi

echo
printf 'Result: %d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
