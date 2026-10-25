#!/bin/bash
# demo_solutions.sh -- runs every Lab Sheet solution (copy solutions/*.sh into ~/lab/scripts first)
#setup: chmod +x *.sh
./ex01_myinfo.sh
./ex02_power.sh 12
./ex02_power.sh
./ex03_hello_name.sh Elif
./ex03_hello_name.sh Can Izmir
./ex04_calc.sh
#> 17
#> 5
./ex05_sign.sh -8
./ex05_sign.sh 0
./ex05_sign.sh
./ex06_what.sh ../docs/syllabus.txt ../src nothing.txt
echo $?
./ex07_table.sh 7
./ex08_sum.sh 100
./ex09_doclines.sh
./ex10_minmax.sh
./ex11_levels.sh
./ex12_temp.sh
for _ in 1 2 3 4 5; do ./ex13_backup_keep.sh; sleep 1; done
ls ../backup
./ex14_guess.sh 37
#> 50
#> 25
#> 37
./ex15_dept.sh ECT
./ex15_dept.sh EE
./ex15_dept.sh XYZ
./ex16_status_bars.sh
