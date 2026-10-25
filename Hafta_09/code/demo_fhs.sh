# demo_fhs.sh -- Week 9: a tour of the Linux directory tree (FHS)
# head -n N FILE prints the first N lines of a file (Week 10 covers it fully).
type ls
cd /
ls
ls -ld /bin /sbin /lib
ls -l /usr/bin/ls
head -n 4 /etc/os-release
ls /var
ls -ld /tmp
ls -l /dev/null /dev/tty /dev/zero
head -n 3 /proc/meminfo
echo $$
head -n 7 /proc/$$/status
cd
