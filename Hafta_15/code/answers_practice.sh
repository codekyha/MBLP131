#!/bin/bash
# answers_practice.sh -- verifies every command/pipeline/script answer of the
# Practice Final in the Week 15 study guide (Parts D, E, F).
source "$(dirname "$0")/demo_lib.sh"

sec pf_d1
p 'cd projects/alpha/src'
p 'cd ../../beta/docs'
p 'pwd'
cd ~/lab

sec pf_d2
p 'mkdir -p archive/{2025,2026}'
p 'ls archive'
rm -rf archive

sec pf_d3
p 'cp docs/*.txt backup/'
p 'ls backup'
p 'ls backup | wc -l'
rm -f backup/*

sec pf_d4
p 'tail -n 3 logs/system.log'

sec pf_d5
p 'chmod 600 docs/syllabus.txt'
p 'ls -l docs/syllabus.txt'

sec pf_d6
p 'sleep 600 &'
p 'jobs'
p 'kill %1'
p 'jobs'

sec pf_d7
p 'find projects -name "*.c"'

sec pf_e1
p 'grep -c ERROR logs/system.log'

sec pf_e2
p "cut -d' ' -f9 logs/access.log | sort | uniq -c | sort -rn"

sec pf_e3
p 'tail -n +2 data/students.csv | cut -d, -f3 | sort | uniq -c | sort -rn'

sec pf_f_src
cp "$(dirname "$0")/count_lines.sh" scripts/
p 'cat scripts/count_lines.sh'

sec pf_f_run
p 'chmod +x scripts/count_lines.sh'
p './scripts/count_lines.sh logs'
p './scripts/count_lines.sh data'
p './scripts/count_lines.sh nosuchdir'
p 'echo $?'
