#!/bin/bash
# ex12_temp.sh -- Lab exercise 12: a function that converts Celsius to Fahrenheit
c2f() {
    echo $(( $1 * 9 / 5 + 32 ))        # exact for multiples of 5
}
echo "Celsius  Fahrenheit"
for c in -10 0 10 20 30 40; do
    printf '%7d  %10d\n' "$c" "$(c2f "$c")"
done
