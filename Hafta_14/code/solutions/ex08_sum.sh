#!/bin/bash
# ex08_sum.sh -- Lab exercise 8: 1 + 2 + ... + N with a while loop
n=${1:-100}
i=1
sum=0
while [ "$i" -le "$n" ]; do
    sum=$((sum + i))
    i=$((i + 1))
done
echo "Loop:    1 + ... + $n = $sum"
echo "Formula: n(n+1)/2   = $((n * (n + 1) / 2))"
