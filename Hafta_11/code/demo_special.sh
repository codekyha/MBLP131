# demo_special.sh -- setuid (passwd) and the sticky bit (/tmp)
ls -l /usr/bin/passwd /etc/shadow
ls -l /usr/bin/sudo /usr/bin/su
ls -ld /tmp
stat -c '%a  %A  %n' /usr/bin/passwd /tmp
ls -l /tmp/w11_admin.txt
rm /tmp/w11_admin.txt
echo "my notes" > /tmp/w11_mine.txt
ls -l /tmp/w11_mine.txt
rm /tmp/w11_mine.txt
