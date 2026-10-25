#!/bin/bash
# answers_sample.sh -- verifies every command/pipeline/script answer of the
# Sample Final paper (exam/MCMP117_Final_Sample) for the answer key.
source "$(dirname "$0")/demo_lib.sh"

sec sf_c1
p 'ls -lah docs'

sec sf_c2
p 'mv docs/notes_01.txt docs/meeting_01.txt'
p 'ls docs'

sec sf_c3
p 'touch report{1..5}.txt'
p 'ls report*'
rm -f report*.txt

sec sf_c4
p 'ln -s logs/access.log latest.log'
p 'ls -l latest.log'
p 'head -n 1 latest.log'
rm -f latest.log

sec sf_c5
p 'touch scripts/backup.sh'
p 'chmod u+x scripts/backup.sh'
p 'ls -l scripts/backup.sh'
rm -f scripts/backup.sh

sec sf_c6
p 'sleep 900 &'
disown              # (not shown) keeps this script's shell from printing a job notice
p 'ps -o pid,stat,cmd'
p 'kill -9 $!'
sleep 0.2
p 'ps -o pid,stat,cmd'

sec sf_c7
p 'du -sh logs'

sec sf_e1
p 'sort data/cities.txt | uniq -c | sort -rn | head -1'

sec sf_e2
p 'grep -c "GET /login " logs/access.log'

sec sf_e3
p 'tail -n +2 data/students.csv | sort -t, -k5 -rn | head -3 | cut -d, -f2,5'

sec sf_f_src
cp "$(dirname "$0")/passfail.sh" scripts/
p 'cat scripts/passfail.sh'

sec sf_f_run
p 'chmod +x scripts/passfail.sh'
p './scripts/passfail.sh 50'
p './scripts/passfail.sh 90'
p './scripts/passfail.sh'
p 'echo $?'
