#!/bin/bash
# demo_proc.sh -- Week 13: the PCB through /proc (links to Week 3).
# Type the commands one by one in a terminal, inside ~/lab.
sleep 300 &
echo $!
grep -E '^(Name|State|Pid|PPid|Uid|Threads|VmRSS)' /proc/$!/status
grep ctxt /proc/$!/status
cat /proc/$!/cmdline | tr '\0' ' '; echo
ls -l /proc/$!/cwd /proc/$!/exe
grep -E '^(Name|State|PPid)' /proc/$$/status
kill $!
