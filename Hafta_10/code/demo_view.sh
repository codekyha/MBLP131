#!/bin/bash
# demo_view.sh -- Week 10: looking inside files: cat, head, tail, wc, file.
#     bash ~/mcmp117_lab_setup.sh && cd ~/lab && bash /path/to/demo_view.sh
p()   { echo "$USER@$(hostname -s):${PWD/#"$HOME"/"~"}\$ $*"; }   # print the prompt and the command
run() { p "$@"; eval "$@" 2>&1; }                               # ... then run it
# tail -f needs a second terminal that appends to the file; here a background
# job does it after 1 s, and timeout stops tail after 3 s (in class: press Ctrl+C).
follow() { p "$1"; (sleep 1; eval "$2") & timeout 3 $1; wait; echo "^C"; }

run 'cat docs/linux_quotes.txt'
run 'cat -n docs/notes_01.txt docs/notes_02.txt'   # -n: number lines; several files are concatenated
run 'head -n 3 data/students.csv'      # first 3 lines (default 10)
run 'tail -n 3 logs/system.log'        # last 3 lines
follow 'tail -n 2 -f logs/system.log' 'echo "2026-10-12 15:00:00 WARN  disk almost full" >> logs/system.log'
run 'wc docs/linux_quotes.txt'         # lines, words, bytes
run 'wc -l data/*.csv data/*.txt'      # -l: lines only
run 'file README.txt src/hello.c data/students.csv photos/img001.jpg projects /usr/bin/ls'
