#!/bin/bash
# demo_grep.sh -- MCMP117 Week 12: grep: search lines
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_grep.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'grep ERROR logs/system.log | head -n 3'
show 'grep -c ERROR logs/system.log'
show 'grep -i "TALK" docs/linux_quotes.txt'
show 'grep -n "backup" logs/system.log | head -n 4'
show 'grep -v INFO logs/system.log | head -n 4'
show 'grep -vc INFO logs/system.log'
show 'grep "Week 1" docs/syllabus.txt'
show 'grep -w "Week 1" docs/syllabus.txt'
show 'grep -r "Project" projects'
