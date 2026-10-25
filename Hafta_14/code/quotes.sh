#!/bin/bash
# quotes.sh -- double quotes, single quotes, backslash, no quotes
name="Ayse"
file="final report.txt"         # a file name that contains a space
# shellcheck disable=SC2016     # (on purpose)
echo 'Single: Hello $name'      # '...' : everything is literal
echo "Double: Hello $name"      # "..." : $var and $( ) expanded
echo "Escaped: it costs \$5"    # \$ : one literal dollar sign
cd ~/lab/docs || exit 1
wc -l "$file"                   # quoted:   ONE argument
# shellcheck disable=SC2086     # (on purpose)
wc -l $file                     # unquoted: TWO arguments
