#!/bin/bash
# demo_streams.sh -- MCMP117 Week 12: the three standard streams (file descriptors 0, 1, 2)
# Usage:  bash mcmp117_lab_setup.sh      # (re)create ~/lab first
#         cd ~/lab && bash ~/path/to/demo_streams.sh
# Every command is printed after a prompt and then executed, exactly as
# if you had typed it. Better still: type the commands yourself!
show() {   # show 'COMMAND' : print prompt + command, then run it
    printf '%s@%s:%s$ %s\n' "$USER" "$(hostname)" "$(dirs +0)" "$1"
    eval "$1"
}
quiet() { eval "$1" >/dev/null 2>&1; }   # a setup step that is not shown
case "$PWD" in */lab) ;; *) echo "Please run me inside your lab folder: cd ~/lab"; exit 1;; esac

show 'ls data nosuch'
show 'ls -l /proc/self/fd'
show 'ls -l /proc/self/fd > fd.txt'
show 'cat fd.txt'
show 'ls -l /proc/self/fd < docs/syllabus.txt'
show 'ls -l /proc/self/fd 2> /dev/null'
quiet 'rm -f fd.txt'
