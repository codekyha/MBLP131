#!/bin/bash
# ex04_calc.sh -- Lab exercise 4: read two integers and calculate
read -r -p "First integer:  " a
read -r -p "Second integer: " b
echo "$a + $b = $((a + b))"
echo "$a - $b = $((a - b))"
echo "$a * $b = $((a * b))"
if [ "$b" -eq 0 ]; then
    echo "Cannot divide by zero"
else
    echo "$a / $b = $((a / b)) remainder $((a % b))"
fi
