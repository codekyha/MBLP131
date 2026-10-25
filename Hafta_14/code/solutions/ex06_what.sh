#!/bin/bash
# ex06_what.sh -- Lab exercise 6: classify every argument; exit 1 if one is missing
status=0
for p in "$@"; do
    if [ -f "$p" ]; then
        echo "$p: file ($(wc -l < "$p") lines)"
    elif [ -d "$p" ]; then
        echo "$p: directory"
    else
        echo "$p: missing"
        status=1
    fi
done
exit $status
