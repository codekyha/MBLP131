#!/bin/bash
# demo_nice.sh -- Week 13: nice and renice (links to Week 5 priority scheduling).
# Type the commands one by one in an interactive terminal, inside ~/lab.
nice
nice -n 10 yes > /dev/null &
ps -o pid,ni,stat,cmd
renice -n 15 -p $!
renice -n 5 -p $!
nice -n -5 sleep 1
kill %1
# two CPU-hungry jobs pinned to the same CPU core (taskset -c 1):
taskset -c 1 yes > /dev/null &
taskset -c 1 nice -n 10 yes > /dev/null &
#@sleep 10
ps -o pid,ni,stat,%cpu,cmd
kill %2 %3
