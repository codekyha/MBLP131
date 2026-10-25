#!/bin/bash
# capture_outputs.sh -- INSTRUCTOR TOOL (students do not need it).
#
# Replays every demo_*.sh of this folder, line by line, in a real interactive
# bash running inside a pseudo-terminal (exactly what a terminal window does),
# and saves the screen transcript as out_<name>.txt. This is how the outputs
# on the slides and in the notes were produced.
#
# Usage (as root):   bash capture_outputs.sh USERNAME
#   USERNAME = an ordinary test account that has ~/mcmp117_lab_setup.sh.
#   The lab folder is re-created before every demo, so outputs are reproducible.
#
# Clean-up applied to the transcripts:
#   * the account name is shown as "student" and the host name as "okan-lab";
#   * "/home/student" in a demo file is replaced by the real home when typed;
#   * in the listing of "/" two entries that exist only on our test machine
#     (container_info.json, old_root) are left out (ls is re-run without them).
# Lines in a demo file that start with '#' are comments and are not typed.
# A "\t" in a demo line is typed as the Tab key (tab completion demo).

U=${1:?usage: bash capture_outputs.sh USERNAME}
H=$(getent passwd "$U" | cut -d: -f6)
HOSTN=$(hostname)
here=$(cd "$(dirname "$0")" && pwd)

for f in "$here"/demo_*.sh; do
    name=$(basename "$f" .sh); name=${name#demo_}
    su - "$U" -c 'bash ~/mcmp117_lab_setup.sh >/dev/null'
    input=$(grep -v '^#' "$f" | grep -v '^[[:space:]]*$' | sed "s#/home/student#$H#g")
    {
        # feed one line at a time so that the shell has finished the previous
        # command before the next one is typed (keeps the transcript in order)
        while IFS= read -r line; do printf '%b\n' "$line"; sleep 0.4; done <<< "$input"
        printf 'exit\n'
    } | su - "$U" -c "script -q -c 'stty cols 80 rows 40; exec env -i HOME=\$HOME USER=\$USER LOGNAME=\$USER SHELL=/bin/bash TERM=dumb LC_ALL=C.UTF-8 PATH=/usr/local/bin:/usr/bin:/bin HISTFILE=/dev/null PS1=\"\\\\u@\\\\h:\\\\w\\\\$ \" bash --norc --noprofile -i' /dev/null" \
      | tr -d '\r\007' > "/tmp/w09_raw_$name.txt"

    python3 - "/tmp/w09_raw_$name.txt" "$here/out_$name.txt" "$U" "$HOSTN" <<'PY'
import sys, re, subprocess, os, tempfile
raw, out, user, host = sys.argv[1:5]
lines = open(raw, encoding="utf8", errors="replace").read().split("\n")
prompt = re.compile(r"^%s@%s:" % (re.escape(user), re.escape(host)))
# drop the terminal's echo of the typed-ahead input (everything before the first prompt)
k = next(i for i, l in enumerate(lines) if prompt.match(l))
lines = lines[k:]
# drop the final "exit"
while lines and (lines[-1].strip() in ("", "exit") or lines[-1].endswith("$ exit")):
    lines.pop()
res, i = [], 0
while i < len(lines):
    l = lines[i]
    res.append(l)
    if prompt.match(l) and l.endswith(":/$ ls"):          # listing of the root directory
        j = i + 1
        while j < len(lines) and not prompt.match(lines[j]): j += 1
        names = [n for n in sorted(os.listdir("/")) if n not in ("container_info.json", "old_root")]
        d = tempfile.mkdtemp(prefix="w09_root_")
        for n in names: open(os.path.join(d, n), "w").close()
        txt = subprocess.run(["ls", "-C", "-w", "80", d], capture_output=True, text=True,
                             env={"LC_ALL": "C.UTF-8", "PATH": "/usr/bin:/bin"}).stdout
        __import__("shutil").rmtree(d)
        res.extend(txt.rstrip("\n").split("\n")); i = j; continue
    i += 1
txt = "\n".join(l.expandtabs(8) for l in res) + "\n"
txt = txt.replace(user, "student")
txt = re.sub(r"@%s:" % re.escape(host), "@okan-lab:", txt)
txt = re.sub(r"\b%s\b" % re.escape(host), "okan-lab", txt)
open(out, "w", encoding="utf8").write(txt)
print("wrote", out, len(res), "lines")
PY
done
