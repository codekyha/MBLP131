#!/bin/bash
# passfail.sh -- how many students reached a given final-exam grade
# usage: ./passfail.sh THRESHOLD           (run inside ~/lab)
if [ $# -ne 1 ]; then
    echo "usage: $0 THRESHOLD" >&2
    exit 1
fi
pass=0
fail=0
for g in $(tail -n +2 data/students.csv | cut -d, -f5); do
    if [ "$g" -ge "$1" ]; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
    fi
done
echo "threshold $1: $pass passed, $fail failed"
