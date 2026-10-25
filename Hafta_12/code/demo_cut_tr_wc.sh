#!/bin/bash
# demo_cut_tr_wc.sh -- MCMP117 Week 12: cut, tr and wc
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_cut_tr_wc.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'head -n 3 data/students.csv | cut -d, -f2'
show 'head -n 3 data/students.csv | cut -d, -f2,5'
show 'head -n 2 logs/access.log | cut -d" " -f1,7,9'
show 'head -n 3 logs/system.log | cut -c12-16'
show 'head -n 3 logs/system.log | cut -d" " -f4'
show 'head -n 3 logs/system.log | tr -s " " | cut -d" " -f4-'
show 'wc logs/system.log'
show 'wc -l data/*'
show 'head -n 2 docs/linux_quotes.txt | tr a-z A-Z'
show 'head -n 2 data/students.csv | tr "," ";"'
show 'echo "Hello, World!" | tr -d ",!"'
