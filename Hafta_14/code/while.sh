#!/bin/bash
# while.sh -- a counting loop, and a file read line by line
n=3
while [ "$n" -gt 0 ]; do                     # repeat WHILE the test is true
    echo "Countdown: $n"
    n=$((n - 1))
done
echo "Go!"

sum=0
count=0
while read -r x; do                          # one line of the file per turn
    sum=$((sum + x))
    count=$((count + 1))
done < ~/lab/data/numbers.txt                # the whole loop reads this file
echo "$count numbers, sum = $sum, average = $((sum / count)) (integer)"
