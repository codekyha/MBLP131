# demo_group.sh -- sharing through a group (the administrator has added you to 'students')
id
groups
chgrp students docs/notes_01.txt
ls -l docs/notes_01.txt
mkdir shared
chgrp students shared
chmod 2770 shared
ls -ld shared
touch shared/plan.txt
ls -l shared
