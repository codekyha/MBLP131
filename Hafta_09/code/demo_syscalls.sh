# demo_syscalls.sh -- Week 9: commands become system calls (link to Weeks 2 and 3)
# strace shows the system calls a program makes; "> /dev/null" hides the
# normal output of ls so that only strace's report is printed (Week 12).
cd ~/lab
strace -e trace=execve,getdents64,write ls docs > /dev/null
/bin/pwd
strace -e trace=getcwd /bin/pwd
strace -e trace=chdir bash -c 'cd /tmp'
pwd
