#!/bin/bash
# demo_redirect.sh -- MCMP117 Week 12: output, input and error redirection
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_redirect.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

quiet 'rm -f notes.txt out.txt err.txt all.txt out2.txt'
show 'echo "first line" > notes.txt'
show 'cat notes.txt'
show 'echo "second line" >> notes.txt'
show 'cat notes.txt'
show 'echo "oops" > notes.txt'
show 'cat notes.txt'
show 'wc -l logs/access.log'
show 'wc -l < logs/access.log'
show 'ls data nosuch > out.txt'
show 'cat out.txt'
show 'ls data nosuch 2> err.txt'
show 'cat err.txt'
show 'ls data nosuch > all.txt 2>&1'
show 'cat all.txt'
show 'ls data nosuch 2>&1 > out2.txt'
show 'cat out2.txt'
show 'ls data nosuch &> all.txt'
show 'ls data nosuch 2> /dev/null'
