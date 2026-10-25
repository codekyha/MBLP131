#!/bin/bash
# demo_worked.sh -- worked practical problems 5-7 of the Week 15 slides.
source "$(dirname "$0")/demo_lib.sh"

sec wp_perm
p 'touch report.sh'
p 'ls -l report.sh'
p 'chmod 750 report.sh'
p 'ls -l report.sh'
p 'umask 027'
p 'touch new.txt; mkdir newdir'
p 'ls -ld new.txt newdir'
rm -rf report.sh new.txt newdir; umask 0002

sec wp_pipe
p "cut -d' ' -f1 logs/access.log | sort | uniq -c | sort -rn | head -3"
p "cut -d' ' -f9 logs/access.log | grep -c '^404\$'"
p "grep ' 404 ' logs/access.log | cut -d' ' -f7 | sort | uniq -c | sort -rn | head -1"

sec wp_script_src
cp "$(dirname "$0")/dept_stats.sh" scripts/
p 'cat scripts/dept_stats.sh'

sec wp_script_run
p 'chmod u+x scripts/dept_stats.sh'
p './scripts/dept_stats.sh ECT'
p './scripts/dept_stats.sh CS'
p './scripts/dept_stats.sh'
p 'echo $?'
