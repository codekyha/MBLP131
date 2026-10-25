#!/bin/bash
# demo_nohup.sh -- Week 13: $$, $!, SIGHUP and nohup.
# Type the commands one by one in an interactive terminal, inside ~/lab.
echo "my shell is PID $$"
sleep 500 &
echo "last background job is PID $!"
nohup sleep 600 &
nohup sleep 700 > /dev/null 2>&1 &
ls
jobs -l
# closing the terminal sends SIGHUP (1) to the jobs; we simulate it:
kill -HUP %1 %2 %3
#@sleep 0.5
jobs -l
kill %2 %3
