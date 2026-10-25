#!/bin/bash
# demo_cp_mv.sh -- Week 10: copying, moving and renaming.
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_cp_mv.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it
ask() { local a=$1; shift; p "$@"; echo "$a" | eval "$@" 2>&1; echo "$a"; }   # simulate typing the answer $a

run 'cp docs/syllabus.txt backup/'                       # copy into a directory (same name)
run 'cp docs/syllabus.txt backup/syllabus_copy.txt'      # copy under a new name
run 'ls backup'
run 'cp -v docs/notes_01.txt docs/notes_02.txt backup/'  # several sources -> last argument is the target dir
ask n 'cp -i docs/syllabus.txt backup/'                  # -i: ask before overwriting (we answer n)
run 'cp projects/alpha backup/'                          # error: directories need -r
run 'cp -r projects/alpha backup/'
run 'tree backup'
run 'ls -i docs/syllabus.txt backup/syllabus.txt'        # a copy is a NEW file: new inode
run 'mv backup/syllabus.txt backup/syllabus_old.txt'     # rename = mv inside the same directory
run 'ls -i backup/syllabus_old.txt'                      # same inode as before: only the name changed
run 'mv -v docs/notes_03.txt backup/'                    # move into another directory
run 'mv backup/alpha backup/alpha_2026'                  # directories are renamed the same way (no -r)
run 'ls docs backup'
