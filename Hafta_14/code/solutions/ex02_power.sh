#!/bin/bash
# ex02_power.sh -- Lab exercise 2: square and cube of a number
if [ $# -ne 1 ]; then
    echo "Usage: $0 NUMBER" >&2
    exit 2
fi
n=$1
echo "n = $n, n^2 = $((n * n)), n^3 = $((n * n * n))"
