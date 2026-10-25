#!/bin/bash
# demo_analysis.sh -- MCMP117 Week 12: real analyses of logs/access.log, logs/system.log and data/students.csv
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_analysis.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'head -n 1 logs/access.log'
show 'cut -d" " -f9 logs/access.log | head -n 3'
show 'cut -d" " -f9 logs/access.log | sort | head -n 3'
show 'cut -d" " -f9 logs/access.log | sort | uniq -c'
show 'cut -d" " -f9 logs/access.log | sort | uniq -c | sort -rn'
show 'cut -d" " -f7 logs/access.log | sort | uniq -c | sort -rn | head -n 5'
show 'cut -d" " -f1 logs/access.log | sort | uniq -c | sort -rn | head -n 3'
show 'grep " 404 " logs/access.log | cut -d" " -f7 | sort | uniq -c | sort -rn | head -n 3'
show 'grep -c ERROR logs/system.log'
show 'grep ERROR logs/system.log | cut -c12-13 | uniq -c'
show 'grep WARN logs/system.log | cut -c27- | sort | uniq -c'
show 'tail -n +2 data/students.csv | cut -d, -f3 | sort | uniq -c | sort -rn'
show 'tail -n +2 data/students.csv | sort -t, -k5 -nr | head -n 3 | cut -d, -f2,3,5'
show 'grep ",ECT," data/students.csv | sort -t, -k4 -nr | head -n 3'
