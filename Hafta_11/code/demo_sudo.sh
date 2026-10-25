# demo_sudo.sh -- sudo for a user who IS an administrator (member of group sudo)
groups
whoami
sudo whoami
ls -l docs/notes_02.txt
chown root docs/notes_02.txt
sudo chown root:root docs/notes_02.txt
ls -l docs/notes_02.txt
echo "more" >> docs/notes_02.txt
sudo -k
