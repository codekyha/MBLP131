#!/bin/bash
# shellcheck disable=SC2050  # constant tests are typed on purpose
# demo_status.sh -- Week 14 demo 4: exit status, test / [ ], file tests
#setup: chmod +x *.sh
ls ../docs > /dev/null
echo $?
ls ../nothing
echo $?
nosuchcommand
echo $?
grep -q ERROR ../logs/system.log
echo $?
grep -q PANIC ../logs/system.log
echo $?
[ 5 -gt 3 ]
echo $?
[ "abc" = "abd" ]
echo $?
type [
./check.sh ../docs/syllabus.txt
./check.sh ../logs
./check.sh /dev/null
./check.sh nothing.txt
echo $?
./check.sh
echo $?
