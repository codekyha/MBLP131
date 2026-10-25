#!/bin/bash
# check.sh -- file tests ([ -f ], [ -d ], [ -e ]) and exit statuses
if [ $# -ne 1 ]; then                  # exactly one argument?
    echo "Usage: $0 PATH" >&2          # >&2 : message goes to stderr
    exit 2                             # 2 = wrong usage
fi
path=$1
if [ -f "$path" ]; then
    echo "$path: regular file, $(wc -l < "$path") lines"
elif [ -d "$path" ]; then
    echo "$path: directory"
elif [ -e "$path" ]; then
    echo "$path: exists, but is neither a file nor a directory"
else
    echo "$path: does not exist" >&2
    exit 1                             # 1 = failure
fi
exit 0                                 # 0 = success
