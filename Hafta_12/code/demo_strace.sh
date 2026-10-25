#!/bin/bash
# demo_strace.sh -- MCMP117 Week 12: what the shell really does: strace shows write(), dup2() and pipe2()
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_strace.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'strace -o t1.txt -e trace=write ls data nosuch'
show 'cat t1.txt'
show 'strace -f -o t2.txt -e trace=openat,dup2,execve bash -c "ls data > list.txt"'
show 'grep -E "list.txt|dup2|execve" t2.txt'
show 'strace -f -o t3.txt -e trace=pipe2,clone,dup2,execve bash -c "grep ERROR logs/system.log | wc -l"'
show 'cat t3.txt'
quiet 'rm -f t1.txt t2.txt t3.txt list.txt'
