#!/bin/bash
# demo_errors.sh -- Week 14 demo 9: the most common scripting mistakes
# The #setup lines create five broken scripts (run them by hand to rebuild them).
#setup: printf '#!/bin/bash\nname = "Ayse"\necho "Hello $name"\n' > bad_space.sh
#setup: printf '#!/bin/bash\nn=5\nif [$n -gt 3]; then echo "big"; fi\n' > bad_test.sh
#setup: printf '#!/bin/bash\nanswer=""\nif [ $answer = yes ]; then echo "OK"; fi\n' > bad_quotes.sh
#setup: printf '#!/bin/bash\nif [ -d ~/lab ]; then\n    echo "lab exists"\n' > bad_if.sh
#setup: printf '#!/bin/bash\r\ncd ~/lab\r\necho "Hello from Windows"\r\n' > win.sh
#setup: chmod +x bad_*.sh win.sh
cat bad_space.sh
./bad_space.sh
cat bad_test.sh
./bad_test.sh
cat bad_quotes.sh
./bad_quotes.sh
cat bad_if.sh
bash -n bad_if.sh
./win.sh
bash win.sh
file win.sh
cat -A win.sh
sed -i 's/\r$//' win.sh
./win.sh
