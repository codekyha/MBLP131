#!/bin/bash
# demo_rm.sh -- Week 10: deleting files and directories. There is NO recycle bin!
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_rm.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it
ask() { local a=$1; shift; p "$@"; echo "$a" | eval "$@" 2>&1; echo "$a"; }   # simulate typing the answer $a

run 'touch junk1.txt junk2.txt junk3.txt'
run 'rm junk1.txt'                     # silent: no question, no recycle bin
ask y 'rm -i junk2.txt'                # -i: ask first (we answer y)
run 'rm -v junk3.txt'                  # -v: say what was removed
run 'ls junk*'                         # all gone
run 'mkdir empty_dir'
run 'rmdir empty_dir'                  # rmdir removes EMPTY directories only
run 'rmdir projects/beta'              # error: not empty
run 'rm projects/beta'                 # error: rm without -r refuses directories
run 'cp -r projects/beta beta_copy'
run 'tree beta_copy'
run 'rm -rv beta_copy'                 # -r: the directory and EVERYTHING below it
run 'ls'
