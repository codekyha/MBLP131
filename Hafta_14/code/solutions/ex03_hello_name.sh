#!/bin/bash
# ex03_hello_name.sh -- Lab exercise 3: greeting with a required and an optional argument
if [ $# -lt 1 ]; then
    echo "Usage: $0 NAME [CITY]" >&2
    exit 1
fi
city=$2
if [ -z "$city" ]; then
    city="Istanbul"                 # default when no city is given
fi
echo "Hello $1 from $city!"
