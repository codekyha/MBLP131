#!/bin/bash
# report.sh -- one-page summary of logs/access.log and data/students.csv
log="$HOME/lab/logs/access.log"
csv="$HOME/lab/data/students.csv"
for f in "$log" "$csv"; do
    if [ ! -r "$f" ]; then echo "Error: cannot read $f" >&2; exit 1; fi
done
echo "===== Lab report, $(date '+%Y-%m-%d %H:%M') ====="

echo "--- Web server: $(basename "$log") ---"
total=$(wc -l < "$log")
errors=$(awk '$9 >= 400' "$log" | wc -l)    # field 9 = status code
echo "Requests: $total, errors (4xx/5xx): $errors ($((100 * errors / total))%)"
echo "Top 3 pages:"
awk '{print $7}' "$log" | sort | uniq -c | sort -rn | head -3

echo "--- Students: $(basename "$csv") ---"
echo "Students: $(tail -n +2 "$csv" | wc -l)"
echo "Per department:"
tail -n +2 "$csv" | cut -d, -f3 | sort | uniq -c
awk -F, 'NR > 1 { m += $4; f += $5; n++ }
         END { printf "Average midterm %.1f, average final %.1f\n", m/n, f/n }' "$csv"
passed=$(awk -F, 'NR > 1 && 0.4*$4 + 0.6*$5 >= 50' "$csv" | wc -l)
echo "Passed (0.4 x midterm + 0.6 x final >= 50): $passed"
