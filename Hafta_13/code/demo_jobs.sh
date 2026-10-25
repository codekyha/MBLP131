#!/bin/bash
# demo_jobs.sh -- Week 13: foreground, background and job control.
# Type the commands one by one in an interactive terminal, inside ~/lab.
# "#@key C-z" means: press Ctrl+Z.  "#@key C-c" means: press Ctrl+C.
# 1) a foreground job blocks the prompt; Ctrl+Z stops it
sleep 100
#@key C-z
jobs
ps -o pid,stat,cmd
# 2) bg lets it continue in the background
bg
jobs -l
ps -o pid,stat,cmd
# 3) start more jobs directly in the background with &
sleep 200 &
yes > /dev/null &
jobs
# 4) fg brings a job back to the foreground; Ctrl+C ends it
fg %3
#@key C-c
jobs
# 5) end the other jobs by job number
kill %1 %2
jobs
jobs
