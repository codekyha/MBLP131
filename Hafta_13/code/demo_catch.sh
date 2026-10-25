#!/bin/bash
# demo_catch.sh -- Week 13: a program that catches SIGINT and SIGTERM.
# Copy catch.c into ~/lab/src first; then type the commands one by one.
cd src
gcc -Wall -O2 -o catch catch.c
./catch
#@key C-c
#@key C-c
#@key C-z
bg
kill -INT %1
kill -TERM %1
#@sleep 0.5
jobs
./catch &
kill -9 %1
#@sleep 0.5
jobs
