#!/bin/bash
# ex15_dept.sh -- Lab exercise 15: students and average final of one department
csv=~/lab/data/students.csv
dept=$1
if [ -z "$dept" ]; then
    echo "Usage: $0 DEPARTMENT" >&2
    exit 2
fi
n=$(cut -d, -f3 "$csv" | grep -cx "$dept")
if [ "$n" -eq 0 ]; then
    echo "No students in department $dept" >&2
    exit 1
fi
avg=$(awk -F, -v d="$dept" '$3 == d { s += $5; k++ } END { printf "%.1f", s/k }' "$csv")
echo "$dept: $n students, average final $avg"
