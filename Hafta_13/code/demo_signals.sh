#!/bin/bash
# demo_signals.sh -- Week 13: sending signals with kill, pkill and killall.
# Type the commands one by one in an interactive terminal, inside ~/lab.
kill -l
kill -l 15
kill -l KILL
# SIGTERM (15), the default of kill: a polite "please terminate"
sleep 300 &
kill $!
wait $!
echo $?
# SIGKILL (9): cannot be caught or ignored -- last resort
sleep 300 &
kill -9 $!
wait $!
echo $?
# SIGINT (2) = what Ctrl+C sends
sleep 300 &
kill -INT $!
wait $!
echo $?
# SIGSTOP / SIGCONT: pause and resume without ending the process
sleep 300 &
kill -STOP $!
ps -o pid,stat,cmd -p $!
kill -CONT $!
ps -o pid,stat,cmd -p $!
kill $!
# pkill and killall: choose processes by NAME (-u: only my own)
sleep 401 &
sleep 402 &
yes > /dev/null &
pgrep -u "$USER" -l sleep
pkill -u "$USER" sleep
#@sleep 0.5
killall -u "$USER" yes
#@sleep 0.5
jobs
pgrep -u "$USER" -l sleep
echo $?
