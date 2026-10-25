# demo_chmod_sym.sh -- chmod in symbolic mode: who (u g o a), op (+ - =), perms (r w x)
cd docs
ls -l syllabus.txt
chmod u+x syllabus.txt
ls -l syllabus.txt
chmod go-w syllabus.txt
ls -l syllabus.txt
chmod a=r syllabus.txt
ls -l syllabus.txt
chmod u=rw,g=r,o= syllabus.txt
ls -l syllabus.txt
chmod u+rwx,g+w syllabus.txt
ls -l syllabus.txt
