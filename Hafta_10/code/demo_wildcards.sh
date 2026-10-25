#!/bin/bash
# demo_wildcards.sh -- Week 10: wildcards (globbing) and brace expansion.
# The SHELL expands the patterns before the command runs; echo shows the result.
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_wildcards.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'cd photos'
run 'ls'
run 'ls *.jpg'                         # *  = any string (also empty)
run 'echo *.png'                       # what does the command receive?
run 'ls img00?.jpg'                    # ?  = exactly one character
run 'ls img01[0-2].jpg'                # [0-2] = one character from the range
run 'ls img00[135].jpg'                # [135] = one of these characters
run 'ls *.[jJ][pP]*'                   # jpg, jpeg and JPG
run 'echo *.gif'                       # no match: the pattern stays as it is
run 'echo "*.jpg"'                     # quoted: no expansion
run 'echo {1..5}'                      # brace expansion: a sequence
run 'echo img{01..03}.jpg'
run 'echo report_{draft,final}.txt'    # a list
run 'mkdir -p ../trip/{day1,day2,day3}/{photos,notes}'
run 'tree ../trip'
run 'cd ../docs'
run 'echo *'                           # * does not match hidden names (starting with .)
run 'echo .*'                          # hidden files must be asked for explicitly
