#!/bin/bash
# demo_mkdir_touch.sh -- Week 10: creating directories and files, timestamps.
# Run it in a FRESH lab folder:
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_mkdir_touch.sh
# (typing the commands one by one is the better exercise).
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'mkdir test'                       # a new, empty directory
run 'ls -ld test'                      # -d: show the directory itself, not its contents
run 'mkdir test'                       # error: it already exists
run 'mkdir trip/day1'                  # error: the parent "trip" does not exist
run 'mkdir -p trip/day1'               # -p: create missing parents, no error if it exists
run 'mkdir -p work/2026/october'
run 'tree work trip'
run 'touch todo.txt'                   # file does not exist -> create it (0 bytes)
run 'ls -l todo.txt'
run 'touch -d "2026-01-15 09:30" todo.txt'   # set the time stamps to a given date
run 'ls -l todo.txt'
run 'stat todo.txt'                    # Access/Modify = 15 Jan, Change = now
run 'touch todo.txt'                   # file exists -> only update times to "now"
run 'ls -l todo.txt'
