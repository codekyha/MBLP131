#!/bin/bash
# demo_strace.sh -- Week 10: which system call does each command use? (link to Weeks 2, 3 and 7)
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_strace.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'strace -e trace=mkdir,mkdirat mkdir newdir'
run 'strace -e trace=rename,renameat,renameat2 mv newdir olddir'
run 'touch file1'
run 'strace -e trace=link,linkat ln file1 file2'
run 'strace -e trace=symlink,symlinkat ln -s olddir sym'
run 'strace -e trace=unlink,unlinkat rm file1 file2 sym'
run 'strace -e trace=rmdir,unlinkat rmdir olddir'
