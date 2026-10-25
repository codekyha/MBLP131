#!/bin/bash
# demo_pipes.sh -- MCMP117 Week 12: pipes: processes connected by a pipe
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_pipes.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'grep ERROR logs/system.log | wc -l'
show 'ls -l /proc/self/fd | cat'
show 'time (sleep 2 | sleep 2)'
show 'yes | head -n 3'
show 'yes "MCMP117" | head -n 100000 | wc -l'
show 'sort data/cities.txt | uniq -c | sort -rn | head -n 3'
