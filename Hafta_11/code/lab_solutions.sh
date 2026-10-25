# lab_solutions.sh -- model solutions of the Week 11 Lab Sheet (run in a fresh ~/lab)
# Lines starting with "#=" only label the parts of the captured transcript.
#= Exercise 1
whoami
id
groups
#= Exercise 2
grep "^$USER:" /etc/passwd
#= Exercise 3
ls -l docs/syllabus.txt
stat -c '%a  %A' docs/syllabus.txt
#= Exercise 5
echo '#!/bin/bash' > scripts/hello.sh
echo 'echo "Hello, $USER! You are in $PWD"' >> scripts/hello.sh
chmod u+x scripts/hello.sh
ls -l scripts/hello.sh
./scripts/hello.sh
#= Exercise 6
chmod g-w,o-r docs/notes_01.txt
ls -l docs/notes_01.txt
#= Exercise 7
chmod 600 docs/notes_02.txt
stat -c '%a  %A  %n' docs/notes_02.txt
#= Exercise 8
chmod 700 projects/alpha
ls -ld projects/alpha
#= Exercise 9
chmod 750 projects/beta
chmod 640 projects/beta/README.md
ls -ld projects/beta
ls -l projects/beta
#= Exercise 10
umask 027
touch t10.txt
mkdir t10
stat -c '%a  %A  %n' t10.txt t10
umask 002
#= Exercise 11
umask 033
touch t11.txt
mkdir t11
stat -c '%a  %A  %n' t11.txt t11
umask 002
#= Exercise 12
mkdir t12
echo "hello" > t12/a.txt
chmod u-x t12
ls t12
cd t12
cat t12/a.txt
chmod u+x t12
cat t12/a.txt
#= Exercise 13
chmod 444 docs/notes_03.txt
rm docs/notes_03.txt #<< y
ls docs
chmod 444 docs/linux_quotes.txt
chmod 555 docs
rm -f docs/linux_quotes.txt
chmod 775 docs
#= Exercise 14
chown root src/hello.c
chgrp students src/hello.c
#= Exercise 15
ls -l /usr/bin/passwd /etc/shadow
ls -ld /tmp
echo "test" > /tmp/w11_ex15.txt
ls -l /tmp/w11_ex15.txt
rm /tmp/w11_ex15.txt
#= Exercise 16
mkdir projects/team
echo '#!/bin/bash' > projects/team/deploy.sh
echo 'echo "deploying..."' >> projects/team/deploy.sh
echo "password=1234" > projects/team/secret.txt
echo "meeting on Monday" > projects/team/notes.txt
chmod 750 projects/team projects/team/deploy.sh
chmod 600 projects/team/secret.txt
chmod 640 projects/team/notes.txt
stat -c '%a  %A  %n' projects/team projects/team/*
./projects/team/deploy.sh
