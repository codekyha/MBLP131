#!/bin/bash
# variables.sh -- variables, command substitution and arithmetic
name="Ayse"                     # NO spaces around the = sign
course=MCMP117
week=14
echo "Student: $name, course: $course, week $week"

today=$(date +%Y-%m-%d)         # $( ) = the OUTPUT of a command
lines=$(wc -l < ~/lab/docs/syllabus.txt)
echo "Today is $today; the syllabus has $lines lines"

left=$((15 - week))             # $(( )) = integer arithmetic
echo "Weeks left until the final exam: $left"
echo "7 / 2 = $((7 / 2)) remainder $((7 % 2))   (integers only!)"
