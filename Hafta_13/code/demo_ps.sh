#!/bin/bash
# demo_ps.sh -- Week 13: looking at processes with ps and pstree.
# Type these commands one by one in a terminal, inside ~/lab.
# Lines starting with "#@" are instructions (wait, press a key), not commands.
echo $$
ps
sleep 300 &
yes > /dev/null &
ps
ps -f
ps -o pid,ppid,stat,ni,%cpu,%mem,cmd
pstree -p $$
ps -ef | head -4
ps -f -u "$USER"
ps aux | head -1
ps aux | grep "^$USER"
kill %1 %2
jobs
