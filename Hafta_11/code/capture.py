#!/usr/bin/env python3
"""capture.py -- instructor tool: run a demo script as a real terminal session
and save a clean transcript (MCMP117 Week 11).

    sudo python3 capture.py USER demo_x.sh out_x.txt [--password PW] [--keep-lab]

Each non-comment line of demo_x.sh is typed into an interactive bash running
as USER inside a pseudo-terminal (so ls, rm -i, sudo ... behave exactly as in
a real terminal). Before the session the lab folder is re-created with
mcmp117_lab_setup.sh (unless --keep-lab). A line may end with   #<< answer
to type 'answer' when the command asks a question (e.g. rm -i).
In the transcript the account name is replaced by 'student' and the host
name by 'okan-lab', so the output matches the slides and notes.
Students do not need this tool: they simply type the commands of demo_x.sh.
"""
import os, pty, re, select, sys, time, argparse

ap = argparse.ArgumentParser()
ap.add_argument("user"); ap.add_argument("script"); ap.add_argument("out")
ap.add_argument("--password"); ap.add_argument("--keep-lab", action="store_true")
a = ap.parse_args()

MARK = "@@P"
setup = "" if a.keep_lab else "bash ~/mcmp117_lab_setup.sh >/dev/null; "
inner = ("export LC_ALL=C.UTF-8 TZ=Europe/Istanbul; " + setup +
         f"cd ~/lab && exec env PS1='{MARK}\\w@@' PS2='> ' bash --norc --noprofile -i")

pid, fd = pty.fork()
if pid == 0:
    os.execvp("su", ["su", "--pty", "-", a.user, "-c", inner])

import fcntl, termios, struct
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 30, 100, 0, 0))  # 100 columns

buf = ""
def read_until(pred, timeout=20):
    global buf
    end = time.time() + timeout
    while time.time() < end:
        if pred(buf):
            return True
        r, _, _ = select.select([fd], [], [], 0.1)
        if r:
            try:
                data = os.read(fd, 4096).decode("utf8", "replace")
            except OSError:
                return False
            buf += data
    return pred(buf)

read_until(lambda b: MARK in b and b.endswith("@@"))
lines = [l.rstrip("\n") for l in open(a.script, encoding="utf8")]
marks = []                      # "#= label" lines split the transcript into labelled parts
for line in lines:
    if line.startswith("#="):
        marks.append((line[2:].strip(), buf.rfind(MARK)))
        continue
    if not line.strip() or line.lstrip().startswith("#"):
        continue
    answers = []
    if "#<<" in line:
        line, ans = line.split("#<<", 1)
        line = line.rstrip(); answers = [ans.strip()]
    n_before = buf.count(MARK)
    os.write(fd, (line + "\n").encode())
    # wait for the next prompt, answering questions on the way
    while not read_until(lambda b: b.count(MARK) > n_before and b.endswith("@@"), timeout=1.0):
        tail = buf[-200:]
        if a.password and re.search(r"\[sudo\] password for [^:]*: $", tail):
            os.write(fd, (a.password + "\n").encode()); time.sleep(0.3); continue
        if answers and tail.rstrip().endswith("?"):
            os.write(fd, (answers.pop(0) + "\n").encode()); time.sleep(0.3); continue
os.write(fd, b"exit\n")
read_until(lambda b: False, timeout=0.5)

def clean(t, last):
    t = t.replace("\r\n", "\n").replace("\r", "")
    t = re.sub(r"\x1b\[[0-9;?]*[A-Za-z]", "", t)          # terminal escape codes
    t = re.sub(r"(?m)^bash: (cannot set terminal process group|no job control).*\n", "", t)
    t = re.sub(re.escape(MARK) + r"([^@]*)@@", lambda m: f"student@okan-lab:{m.group(1)}$ ", t)
    t = t.rstrip()
    if last:
        t = re.sub(r"\n?student@okan-lab:[^\n]*\$ (exit\nexit)?$", "", t)  # final prompt + exit
    t = t.replace(a.user, "student")
    t = re.sub(r"\bvm\b", "okan-lab", t)
    return t.strip("\n") + "\n"

if marks:
    start = buf.find(MARK)
    if marks[0][1] > start:
        marks.insert(0, ("", start))
    parts = []
    for i, (label, idx) in enumerate(marks):
        end = marks[i + 1][1] if i + 1 < len(marks) else len(buf)
        parts.append(("### " + label + "\n" if label else "") + clean(buf[idx:end], i + 1 == len(marks)))
    t = "".join(parts)
else:
    t = clean(buf[buf.find(MARK):], True)
open(a.out, "w", encoding="utf8").write(t)
print("wrote", a.out)
