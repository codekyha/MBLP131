#!/bin/bash
# ex10_minmax.sh -- Lab exercise 10: minimum, maximum, sum, average of numbers.txt
file=~/lab/data/numbers.txt
count=0
sum=0
while read -r x; do
    if [ "$count" -eq 0 ]; then min=$x; max=$x; fi   # first number
    if [ "$x" -lt "$min" ]; then min=$x; fi
    if [ "$x" -gt "$max" ]; then max=$x; fi
    sum=$((sum + x))
    count=$((count + 1))
done < "$file"
echo "count=$count min=$min max=$max sum=$sum average=$((sum / count))"
