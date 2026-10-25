#!/bin/bash
# demo_regex.sh -- MCMP117 Week 12: simple regular expressions with grep
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_regex.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'grep "^Week [0-9] " docs/syllabus.txt'
show 'grep "s$" docs/syllabus.txt'
show 'grep "c.de" docs/linux_quotes.txt'
show 'grep -c "5.38" logs/access.log'
show 'grep -c "5\.38" logs/access.log'
show 'grep "5.38" logs/access.log | grep -v "5\.38"'
show 'grep ",ECT,[0-9]*,9[0-9]$" data/students.csv'
show 'grep "^2026-10-12 1[0-1]:.*ERROR" logs/system.log'
