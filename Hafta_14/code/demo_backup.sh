#!/bin/bash
# demo_backup.sh -- Week 14 demo 7: the complete backup script
#setup: chmod +x *.sh
./backup.sh
ls -l ../backup
tar -tzf ../backup/docs_*.tar.gz
sleep 2
./backup.sh
ls ../backup
