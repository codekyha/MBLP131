#!/bin/bash
# demo_zombie.sh -- Week 13: seeing process state Z (links to Week 3).
# Copy zombie.c into ~/lab/src first; then type the commands one by one.
cd src
gcc -Wall -O2 -o zombie zombie.c
./zombie 25 &
#@sleep 1
ps -o pid,ppid,stat,cmd
grep State /proc/$(pgrep -u "$USER" -n zombie)/status
kill -9 $(pgrep -u "$USER" -n zombie)
ps -o pid,ppid,stat,cmd
# the zombie cannot be killed: it is already dead. Only wait() removes it.
#@timeout 30
wait
ps -o pid,ppid,stat,cmd
