#!/bin/bash
# ex07_table.sh -- Lab exercise 7: multiplication table of N
n=${1:-7}                          # default 7 when no argument is given
for i in {1..10}; do
    echo "$n x $i = $((n * i))"
done
