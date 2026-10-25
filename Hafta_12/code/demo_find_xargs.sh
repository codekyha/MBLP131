#!/bin/bash
# demo_find_xargs.sh -- MCMP117 Week 12: find, -exec and xargs
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_find_xargs.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

quiet 'chmod -R u+rwx secret; rm -rf secret wc'
show 'find docs -name "*.txt"'
show 'find . -type d -name src'
show 'find . -size +10k'
show 'find photos -iname "*.jp*g" | wc -l'
show 'touch -d "2026-09-01" docs/notes_01.txt'
show 'find docs -mtime +30'
show 'find . -name "*.c" -exec wc -l {} \;'
show 'find . -name "*.c" | xargs wc -l'
show 'find docs -name "*.txt" | xargs wc -l'
show 'find docs -name "*.txt" -print0 | xargs -0 wc -l'
show 'mkdir secret && chmod 000 secret'
show 'find . -name "*.md"'
show 'find . -name "*.md" 2> /dev/null'
quiet 'chmod 755 secret; rmdir secret'
