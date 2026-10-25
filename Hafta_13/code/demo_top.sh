#!/bin/bash
# demo_top.sh -- Week 13: one snapshot of top (batch mode, -b -n 1).
# Interactively, just type top (q quits) or htop.
yes > /dev/null &
sleep 200 &
#@sleep 30
cat /proc/loadavg
nproc
top -b -n 1 -u "$USER" | head -15
uptime
kill %1 %2
