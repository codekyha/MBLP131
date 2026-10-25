#!/bin/bash
# lab_solutions.sh -- MCMP117 Week 12: solutions of the Lab Sheet (exercises A1-D4)
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/lab_solutions.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

quiet 'rm -f list.txt ok.txt err.txt both.txt errors_500.txt; mkdir -p secret; chmod 000 secret'
# ---- Part A: redirection
show 'ls data > list.txt'
show 'ls docs >> list.txt'
show 'wc -l list.txt'
show 'ls data nosuch > ok.txt 2> err.txt'
show 'cat err.txt'
show 'wc -l < logs/system.log'
show 'ls data nosuch > both.txt 2>&1'
show 'ls data nosuch 2>&1 > both.txt'
show 'find . -name "*.md" 2> /dev/null'
# ---- Part B: grep
show 'grep -c ERROR logs/system.log'
show 'grep -vn INFO logs/system.log | head -n 3'
show 'grep -c " 404 " logs/access.log'
show 'grep ",EE," data/students.csv'
show 'grep -c "^10\.0\.5\.38 " logs/access.log'
# ---- Part C: pipelines
show 'tail -n +2 data/students.csv | cut -d, -f3 | sort | uniq -c'
show 'tail -n +2 data/students.csv | sort -t, -k5 -nr | head -n 3 | cut -d, -f2,5'
show 'cut -d" " -f9 logs/access.log | sort | uniq -c | sort -rn'
show 'cut -d" " -f7 logs/access.log | sort | uniq -c | sort -rn | head -n 3'
show 'grep " 404 " logs/access.log | cut -d" " -f7 | sort | uniq -c | sort -rn | head -n 1'
show 'grep ERROR logs/system.log | cut -c12-13 | uniq -c'
# ---- Part D: challenge
show 'cut -d, -f2 data/students.csv | sort | uniq -d'
show 'grep " 500 " logs/access.log | tee errors_500.txt | wc -l'
show 'find docs -name "*.txt" -print0 | xargs -0 wc -l'
show 'cut -d" " -f1 logs/access.log | sort -u | wc -l'
show 'cut -d" " -f1 logs/access.log | sort | uniq -c | sort -n | head -n 1'
quiet 'chmod 755 secret; rmdir secret'
