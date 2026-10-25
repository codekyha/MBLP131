#!/bin/bash
# ex14_guess.sh -- Lab exercise 14: guess the secret number (1-100)
secret=${1:-$((RANDOM % 100 + 1))}       # fixed secret if given (for testing)
tries=0
guess=0
while [ "$guess" -ne "$secret" ]; do
    read -r -p "Your guess: " guess
    tries=$((tries + 1))
    if [ "$guess" -lt "$secret" ]; then
        echo "Too small"
    elif [ "$guess" -gt "$secret" ]; then
        echo "Too big"
    fi
done
echo "Correct! You needed $tries tries."
