# demo_owner.sh -- chown and chgrp as an ordinary user
ls -l docs/notes_01.txt
chown root docs/notes_01.txt
chgrp students docs/notes_01.txt
chown $USER docs/notes_01.txt
