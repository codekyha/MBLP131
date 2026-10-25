# demo_script.sh -- making a script (and a compiled program) executable
cd scripts
echo '#!/bin/bash' > hello.sh
echo 'echo "Hello, $USER! You are in $PWD"' >> hello.sh
cat hello.sh
ls -l hello.sh
./hello.sh
bash hello.sh
chmod u+x hello.sh
ls -l hello.sh
./hello.sh
hello.sh
cd ../src
gcc -Wall -O2 hello.c -o hello
ls -l hello.c hello
./hello
