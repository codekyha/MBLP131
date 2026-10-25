# demo_umask.sh -- default permissions: new file 666 / new directory 777, minus the umask bits
mkdir umask_test
cd umask_test
umask
umask -S
touch f_002
mkdir d_002
umask 022
touch f_022
mkdir d_022
umask 077
touch f_077
mkdir d_077
umask 033
touch f_033
mkdir d_033
umask 002
stat -c '%a  %A  %n' f_* d_*
