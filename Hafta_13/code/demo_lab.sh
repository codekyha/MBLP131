#!/bin/bash
# demo_lab.sh -- Week 13: model solutions for the Lab Sheet (selected exercises).
# Type the commands one by one in an interactive terminal, inside ~/lab.
# Exercise 3
sleep 1000 &
grep -E '^(State|PPid)' /proc/$!/status
echo $$
# Exercise 5
yes > /dev/null &
ps -o pid,stat,cmd
# Exercise 9: job number versus PID
kill 1
kill %1
# Exercise 12
sleep 901 &
sleep 902 &
sleep 903 &
pgrep -c -u "$USER" sleep
pkill -u "$USER" sleep
#@sleep 0.5
pgrep -c -u "$USER" sleep
# Exercise 14
nice -n 15 sleep 600 &
ps -o pid,ni,stat,cmd -p $!
renice -n 19 -p $!
renice -n 0 -p $!
# Exercise 16 and 17
ps -u "$USER" -o pid,stat,%cpu,cmd --sort=-%cpu | head -4
ps -u "$USER" -o stat= | cut -c1 | sort | uniq -c
kill %2 %3
