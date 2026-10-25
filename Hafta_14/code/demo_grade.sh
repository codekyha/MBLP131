#!/bin/bash
# demo_grade.sh -- Week 14 demo 5: if / elif / else and debugging with bash -x
#setup: chmod +x *.sh
./grade.sh 92
./grade.sh 72
./grade.sh 49
./grade.sh 150
./grade.sh
./grade.sh abc
bash -x grade.sh 72
