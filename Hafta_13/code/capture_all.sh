#!/bin/bash
# capture_all.sh -- (instructor tool) re-capture every out_*.txt of Week 13.
# Run as root:  bash capture_all.sh [demo_name ...]
# Each demo runs as the normal user U (default stdnt13) in a fresh ~/lab,
# then the user name is replaced by "student" in the saved output.
# The recorder (record_session.py) runs as root and plays the role of the
# terminal window; the shell inside it runs as the user.
U=${U:-stdnt13}
HERE=$(cd "$(dirname "$0")" && pwd)
demos=${*:-"ps proc top jobs signals catch nohup nice zombie lab"}
for d in $demos; do
    tmp=/tmp/w13_out_$d.txt; rm -f "$tmp"
    su - "$U" -c "export LC_ALL=C.UTF-8; bash ~/mcmp117_lab_setup.sh >/dev/null;
        cp '$HERE/zombie.c' '$HERE/catch.c' ~/lab/src/"
    python3 "$HERE/record_session.py" "$HERE/demo_$d.sh" "$tmp" 80 "$U"
    pkill -KILL -u "$U" 2>/dev/null; sleep 0.5            # leave nothing behind
    sed -e "s/$U/student/g" -e 's/\bvm\b/okan-lab/g' "$tmp" > "$HERE/out_$d.txt"
    echo "captured out_$d.txt ($(wc -l < "$HERE/out_$d.txt") lines)"
done
