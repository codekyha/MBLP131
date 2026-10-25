#!/bin/bash
# demo_stat_du_df.sh -- Week 10: metadata (stat, link to Week 7 inodes) and disk usage.
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_stat_du_df.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'stat docs/syllabus.txt'
run 'stat -c "%n: %s bytes, inode %i, %h link(s)" docs/*.txt'   # -c: choose the fields
run 'du -sh docs data logs photos'     # disk usage: -s summary, -h human-readable
run 'du -h projects'
run 'df -h ~'                          # free space on the file system holding ~
