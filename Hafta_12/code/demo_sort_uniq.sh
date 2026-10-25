#!/bin/bash
# demo_sort_uniq.sh -- MCMP117 Week 12: sort and uniq
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_sort_uniq.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'sort data/cities.txt | head -n 4'
show 'tail -n +2 data/students.csv | cut -d, -f5 | sort | head -n 3'
show 'tail -n +2 data/students.csv | cut -d, -f5 | sort -n | head -n 3'
show 'sort -t, -k5 -nr data/students.csv | head -n 3'
show 'uniq -c data/cities.txt | head -n 4'
show 'sort data/cities.txt | uniq -c'
show 'sort data/cities.txt | uniq -c | sort -rn | head -n 3'
show 'cut -d, -f2 data/students.csv | sort | uniq -d'
