# demo_chmod_oct.sh -- chmod in octal mode: r = 4, w = 2, x = 1
cd docs
chmod 754 syllabus.txt
ls -l syllabus.txt
chmod 640 syllabus.txt
chmod 600 notes_01.txt
chmod 644 notes_02.txt
chmod 700 ../backup
stat -c '%a  %A  %n' syllabus.txt notes_01.txt notes_02.txt ../backup
chmod 854 notes_03.txt
chmod rw notes_03.txt
