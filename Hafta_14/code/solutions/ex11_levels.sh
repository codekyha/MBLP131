#!/bin/bash
# ex11_levels.sh -- Lab exercise 11: messages per level in system.log
log=~/lab/logs/system.log
total=$(wc -l < "$log")
for level in INFO WARN ERROR; do
    n=$(grep -c " $level " "$log")
    echo "$level: $n of $total lines ($((100 * n / total))%)"
done
