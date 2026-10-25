#!/bin/bash
# count_lines.sh -- print the number of lines of every regular file in a directory
# usage: ./count_lines.sh DIRECTORY
if [ $# -ne 1 ] || [ ! -d "$1" ]; then
    echo "usage: $0 DIRECTORY" >&2
    exit 1
fi
total=0
for f in "$1"/*; do
    if [ -f "$f" ]; then
        n=$(wc -l < "$f")
        echo "$f: $n lines"
        total=$((total + n))
    fi
done
echo "total: $total lines"
