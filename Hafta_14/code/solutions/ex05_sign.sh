#!/bin/bash
# ex05_sign.sh -- Lab exercise 5: positive / negative / zero, and even / odd
if [ $# -ne 1 ]; then
    echo "Usage: $0 INTEGER" >&2
    exit 2
fi
n=$1
if [ "$n" -gt 0 ]; then
    sign="positive"
elif [ "$n" -lt 0 ]; then
    sign="negative"
else
    sign="zero"
fi
if [ $((n % 2)) -eq 0 ]; then parity="even"; else parity="odd"; fi
echo "$n is $sign and $parity"
