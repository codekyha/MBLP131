#!/bin/bash
# demo_links.sh -- Week 10: hard and symbolic links, cp vs mv vs ln (recap of Week 7).
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_links.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it

run 'cd docs'
run 'ln syllabus.txt plan.txt'         # hard link: a 2nd name for the same inode
run 'cp syllabus.txt copy.txt'         # copy: a new inode with the same bytes
run 'ln -s syllabus.txt shortcut.txt'  # symbolic link: a small file storing a path
run 'ls -li syllabus.txt plan.txt copy.txt shortcut.txt'
run 'echo "Week 16  Party" >> plan.txt'  # change the data through ONE name ...
run 'tail -n 1 syllabus.txt copy.txt'    # ... visible through the other, not in the copy
run 'rm syllabus.txt'
run 'ls -li plan.txt shortcut.txt'     # link count back to 1; the symlink dangles
run 'cat shortcut.txt'
run 'cd ..'
run 'ln -s projects/alpha/docs alpha_docs'   # symlinks may point to directories
run 'ls -l alpha_docs'
run 'ls alpha_docs/'
run 'ln projects alpha_hard'           # hard links to directories are forbidden
run 'ls -ld projects projects/alpha'   # directory link count = 2 + number of subdirectories
