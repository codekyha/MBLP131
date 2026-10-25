#!/bin/bash
# dept_stats.sh -- number of students and average final grade of ONE department
# usage: ./dept_stats.sh DEPARTMENT        (run inside ~/lab)
if [ $# -ne 1 ]; then
    echo "usage: $0 DEPARTMENT" >&2
    exit 1
fi
dept=$1
count=0
sum=0
for f in $(grep ",$dept," data/students.csv | cut -d, -f5); do
    count=$((count + 1))
    sum=$((sum + f))
done
if [ $count -eq 0 ]; then
    echo "no students in $dept"
    exit 2
fi
echo "$dept: $count students, average final $((sum / count))"
