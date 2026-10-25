#!/bin/bash
# demo_quoting.sh -- Week 10: file names that contain spaces.
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_quoting.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'ls docs'
run 'cat docs/final report.txt'        # TWO arguments: "docs/final" and "report.txt"
run 'cat "docs/final report.txt"'      # double quotes: one argument
run "cat 'docs/final report.txt'"      # single quotes: one argument
run 'cat docs/final\ report.txt'       # backslash: escape the space
run 'mkdir my photos'                  # creates "my" -- and fails on "photos"
run 'mkdir "my photos"'
run 'ls -d my*'
