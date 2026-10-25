#!/bin/bash
# demo_recap.sh -- the practical recap of Weeks 9-14 (slides + study guide).
# Run inside a fresh ~/lab (bash mcmp117_lab_setup.sh; cd ~/lab; bash demo_recap.sh)
source "$(dirname "$0")/demo_lib.sh"

sec w09
p 'pwd'
p 'ls'
p 'cd projects/alpha/src'
p 'pwd'
p 'cd ../../beta/docs'
p 'pwd'
p 'cd ~/lab'

sec w10
p 'ls photos/img00?.jpg'
p 'echo photos/*.{png,JPG}'
p 'mkdir -p backup/{2025,2026}'
p 'cp docs/notes_0*.txt backup/2026/'
p 'ls backup/2026'
p 'wc -l data/students.csv docs/syllabus.txt'
p 'ln -s ../logs/access.log docs/latest.log'
p 'ls -l docs/latest.log'
rm -f docs/latest.log; rm -rf backup/2025 backup/2026

sec w11
p 'id'
p 'touch scripts/run.sh'
p 'ls -l scripts/run.sh'
p 'chmod 750 scripts/run.sh'
p 'ls -l scripts/run.sh'
p 'chmod g-x,o+r scripts/run.sh'
p 'ls -l scripts/run.sh'
p 'umask'
rm -f scripts/run.sh

sec w12
p 'grep -c ERROR logs/system.log'
p 'grep -n ERROR logs/system.log | head -3'
p "cut -d' ' -f9 logs/access.log | sort | uniq -c | sort -rn"
p 'ls nosuchfile 2> errors.txt'
p 'cat errors.txt'
rm -f errors.txt

sec w13
p 'sleep 600 &'
p 'echo $!'
p 'jobs'
p 'ps -o pid,ppid,stat,cmd'
p 'kill %1'
p 'kill -l TERM KILL INT STOP CONT'

sec w14
p 'name=student; echo "Hello $name"'
p "echo 'Hello \$name'"
p 'echo "2^10 = $((2 ** 10))"'
p 'n=$(wc -l < data/students.csv); echo "students.csv has $n lines"'
p '[ -d logs ] && echo "logs is a directory"'
p 'for c in 1 2 3; do echo "item $c"; done'
