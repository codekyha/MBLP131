#!/bin/bash
# loops.sh -- three kinds of for loop
for city in Istanbul Ankara Izmir; do       # 1) over a list of words
    echo "City: $city"
done

for i in {1..5}; do                          # 2) over a range of numbers
    echo -n "$i squared is $((i * i)); "
done
echo                                         # finish the line

for f in ~/lab/docs/*.txt; do                # 3) over files (wildcard)
    echo "$(basename "$f"): $(wc -l < "$f") lines"
done
