#!/bin/bash
# capture_all.sh -- instructor tool: re-captures every out_*.txt of Week 11 (run as root).
# The demos themselves run as an ORDINARY user ($U); root is used only to SET UP
# situations (a root-owned file in /tmp, group membership, sudo rights) and is undone at the end.
set -e
U=${1:-stdnt11}
cd "$(dirname "$0")"
C="python3 capture.py $U"
cp mcmp117_lab_setup.sh /home/$U/ && chown $U: /home/$U/mcmp117_lab_setup.sh

# 1. plain user: no extra groups, no sudo rights
$C demo_users.sh      out_users.txt
$C demo_ls.sh         out_ls.txt
$C demo_chmod_sym.sh  out_chmod_sym.txt
$C demo_chmod_oct.sh  out_chmod_oct.txt
$C demo_script.sh     out_script.txt
$C demo_umask.sh      out_umask.txt
$C demo_dirperm.sh    out_dirperm.txt
$C demo_owner.sh      out_owner.txt
$C demo_order.sh      out_order.txt
install -o root -g root -m 666 /dev/null /tmp/w11_admin.txt      # setup: a root file in /tmp
echo "admin notes" > /tmp/w11_admin.txt
$C demo_special.sh    out_special.txt
$C lab_solutions.sh   out_lab_solutions.txt

# 2. sudo for a non-administrator (a password is needed for the prompt)
OLD=$(getent shadow $U | cut -d: -f2)
PW="w11-$RANDOM-demo"
echo "$U:$PW" | chpasswd
$C demo_sudo_denied.sh out_sudo_denied.txt --password "$PW"

# 3. the administrator adds the user to group 'students'
usermod -aG students $U
$C demo_group.sh      out_group.txt

# 4. the administrator makes the user a sudoer (Ubuntu: member of group 'sudo')
usermod -aG sudo $U
$C demo_sudo.sh       out_sudo.txt --password "$PW"

# undo the setup
gpasswd -d $U sudo >/dev/null; gpasswd -d $U students >/dev/null
usermod -p "$OLD" $U
rm -f /tmp/w11_admin.txt /tmp/w11_mine.txt
rm -f /var/run/sudo/ts/$U
echo "all outputs captured"
