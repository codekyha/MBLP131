#!/bin/bash
# shellcheck disable=SC2283,SC2012  # the mistake "name = Ayse" is shown on purpose
# demo_variables.sh -- Week 14 demo 2: variables, quoting, $( ) and $(( ))
#setup: chmod +x *.sh
name="Ayse"
echo $name
echo "Hello, $name!"
name = Ayse
echo "Files in docs: $(ls ../docs | wc -l)"
echo $((3 + 4 * 2))
./variables.sh
./quotes.sh
