# demo_ls.sh -- reading the mode string with ls -l, ls -ld and stat (Week 11)
ls -l
ls -l docs
ls -ld docs
stat docs/syllabus.txt
stat -c '%A  %a  %U  %G  %n' docs/syllabus.txt docs src/hello.c
