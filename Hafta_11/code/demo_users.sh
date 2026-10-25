# demo_users.sh -- who am I? users, groups and the account files (Week 11)
whoami
id
groups
grep "^root:" /etc/passwd
grep "^$USER:" /etc/passwd
grep "^$USER:" /etc/group
getent group students
ls -l /etc/passwd /etc/group /etc/shadow
cat /etc/shadow
