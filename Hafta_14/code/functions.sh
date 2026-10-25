#!/bin/bash
# functions.sh -- define a block of commands once, call it many times
line() {                                  # no arguments
    echo "------------------------------------"
}
count_word() {                            # $1 = word, $2 = file
    local n                               # local: exists only in here
    n=$(grep -c -- "$1" "$2")
    echo "$1 appears on $n lines of $(basename "$2")"
}
is_even() {                               # the exit status is the answer
    [ $(( $1 % 2 )) -eq 0 ]
}
line
count_word ERROR ~/lab/logs/system.log
count_word WARN  ~/lab/logs/system.log
line
for k in 7 12; do
    if is_even "$k"; then echo "$k is even"; else echo "$k is odd"; fi
done
