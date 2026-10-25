#!/bin/bash
# greet.sh -- reading input from the keyboard with read
read -r -p "What is your name? " name
read -r -p "Which year were you born? " year
age=$(( $(date +%Y) - year ))
echo "Nice to meet you, $name. You are about $age years old."
