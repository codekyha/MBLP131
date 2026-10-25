#!/bin/bash
# ex09_doclines.sh -- Lab exercise 9: lines per document, total, longest
total=0
max=0
longest=""
for f in ~/lab/docs/*.txt; do
    n=$(wc -l < "$f")
    printf '%-18s %3d\n' "$(basename "$f")" "$n"
    total=$((total + n))
    if [ "$n" -gt "$max" ]; then
        max=$n
        longest=$(basename "$f")
    fi
done
echo "Total: $total lines; longest: $longest ($max lines)"
