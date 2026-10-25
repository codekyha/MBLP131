#!/bin/bash
# ex16_status_bars.sh -- Lab exercise 16: bar chart of HTTP status codes (# = 5 requests)
log=~/lab/logs/access.log
awk '{print $9}' "$log" | sort | uniq -c | while read -r count code; do
    bar=""
    for ((i = 0; i < count / 5; i++)); do bar="$bar#"; done
    printf '%s %4d %s\n' "$code" "$count" "$bar"
done
