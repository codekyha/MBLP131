#!/bin/bash
# grade.sh -- numeric tests with if / elif / else
# Usage: ./grade.sh SCORE        (an example scale, not an official one)
score=$1
if [ -z "$score" ]; then               # -z : the string is empty
    echo "Usage: $0 SCORE (0-100)" >&2
    exit 2
fi
if [ "$score" -lt 0 ] || [ "$score" -gt 100 ]; then
    echo "Error: score must be between 0 and 100" >&2
    exit 1
elif [ "$score" -ge 85 ]; then
    letter=A
elif [ "$score" -ge 70 ]; then
    letter=B
elif [ "$score" -ge 50 ]; then
    letter=C
else
    letter=F
fi
echo "Score $score -> grade $letter"
