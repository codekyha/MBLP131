#!/bin/bash
# capture.sh -- (instructor/maintainer tool, run as root in the build container)
# Runs every Week 15 demo/answer script as the week's normal user (stdnt15) in a
# freshly created ~/lab, then writes one out_<section>.txt per "#### section".
# In all output the user name stdnt15 becomes "student" (user, group, /home path).
set -e
U=stdnt15
HERE=$(cd "$(dirname "$0")" && pwd)
STAGE=/home/$U/w15
rm -rf "$STAGE"; mkdir -p "$STAGE"
cp "$HERE"/demo_lib.sh "$HERE"/demo_*.sh "$HERE"/answers_*.sh "$HERE"/*.sh "$STAGE"/ 2>/dev/null || true
cp "$HERE"/mcmp117_lab_setup.sh /home/$U/mcmp117_lab_setup.sh
chown -R $U:$U "$STAGE" /home/$U/mcmp117_lab_setup.sh
for s in "$HERE"/demo_recap.sh "$HERE"/demo_worked.sh "$HERE"/answers_*.sh; do
    b=$(basename "$s")
    # 'exec' so that the demo script itself is the shell seen by ps (no su wrapper line)
    # 'script' gives the commands a real terminal (so ls prints columns, as students see it)
    su - $U -c "export LC_ALL=C.UTF-8; bash ~/mcmp117_lab_setup.sh >/dev/null; cd ~/lab && script -qc 'stty cols 80; exec bash $STAGE/$b' /dev/null" \
        > /tmp/w15_raw.txt 2>&1 || true
    tr -d '\r' < /tmp/w15_raw.txt | expand -t 8 | sed -e "s/$U/student/g" -e 's/\bvm\b/okan-lab/g' > /tmp/w15_clean.txt
    cat /tmp/w15_clean.txt > "$HERE/raw_${b%.sh}.txt"
    awk -v dir="$HERE" '/^#### /{f=dir "/out_" $2 ".txt"; printf "" > f; next} f{print >> f}' "$HERE/raw_${b%.sh}.txt"
done
rm -f /tmp/w15_raw.txt /tmp/w15_clean.txt "$HERE"/raw_*.txt
rm -rf "$STAGE"
ls "$HERE"/out_*.txt | wc -l
