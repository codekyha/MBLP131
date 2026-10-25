#!/bin/bash
# demo_loops.sh -- Week 14 demo 6: for and while loops, functions
#setup: chmod +x *.sh
./loops.sh
./while.sh
./functions.sh
for f in ../photos/*.png ../photos/*.JPG; do echo "found $f"; done
