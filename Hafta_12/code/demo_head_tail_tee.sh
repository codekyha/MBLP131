#!/bin/bash
# demo_head_tail_tee.sh -- MCMP117 Week 12: head and tail in pipelines, tee
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_head_tail_tee.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

quiet 'rm -f errors_500.txt'
show 'head -n 2 logs/access.log'
show 'tail -n 2 logs/system.log'
show 'tail -n +2 data/students.csv | head -n 2'
show 'head -n 120 logs/access.log | tail -n 1'
show 'grep " 500 " logs/access.log | tee errors_500.txt | wc -l'
show 'head -n 2 errors_500.txt'
show 'wc -l errors_500.txt'
