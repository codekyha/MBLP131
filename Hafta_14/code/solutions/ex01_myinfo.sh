#!/bin/bash
# ex01_myinfo.sh -- Lab exercise 1: information about me and my lab
echo "User:      $(whoami)"
echo "Home:      $HOME"
echo "Date:      $(date +%Y-%m-%d)"
echo "Shell:     $SHELL"
students=$(( $(wc -l < ~/lab/data/students.csv) - 1 ))   # minus the header line
echo "Students in students.csv: $students"
