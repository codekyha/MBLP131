#!/bin/bash
# args.sh -- positional parameters: the words typed after the script name
echo "Script name  \$0 = $0"
echo "First arg    \$1 = $1"
echo "Second arg   \$2 = $2"
echo "Arg count    \$# = $#"
echo "All args     \$@ =" "$@"
i=1
for arg in "$@"; do             # "green tea" stays ONE word
    echo "  argument $i: [$arg]"
    i=$((i + 1))
done
