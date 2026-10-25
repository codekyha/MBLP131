#!/bin/bash
# demo_fileops.sh -- Week 10: compile and run fileops.c (the system calls behind the commands).
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_fileops.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it
[ -f fileops.c ] || cp "$(dirname "$(readlink -f "$0")")/fileops.c" .   # bring the source into ~/lab

run 'gcc -Wall -O2 fileops.c -o fileops'
run './fileops'
