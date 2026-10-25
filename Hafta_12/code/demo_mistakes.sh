#!/bin/bash
# demo_mistakes.sh -- MCMP117 Week 12: common mistakes, made on purpose
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_mistakes.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

quiet 'rm -f c.txt wc'
show 'cp data/cities.txt c.txt'
show 'sort c.txt > c.txt'
show 'wc -l c.txt'
show 'grep user login logs/system.log'
show 'grep "user login" logs/system.log | wc -l'
show 'ls data > wc'
show 'ls'
show 'cat wc'
show 'sort -t, -k5 -n data/students.csv | head -n 2'
quiet 'rm -f c.txt wc'
