#!/usr/bin/env python3
"""run_demo.py -- instructor tool (students do not need it).

Replays a demo_*.sh file line by line in a REAL interactive bash (through a
pseudo-terminal), exactly as if a student typed it, and saves the screen
transcript with the prompt  student@okan-lab:~/lab/scripts$ .

    sudo python3 run_demo.py USER demo_first.sh out_first.txt

Before the replay it re-creates ~/lab with mcmp117_lab_setup.sh and copies the
example scripts of this folder into ~/lab/scripts (mode 664, i.e. NOT yet
executable, like a freshly written file).  Lines in the demo file:
    command            typed at the prompt
    #> text            typed as keyboard input for a running `read`
    #setup: command    run silently before recording starts
    # comment / empty  ignored
In the transcript USER is replaced by "student" and the hostname by "okan-lab".
"""
import os, pty, re, select, shutil, socket, subprocess, sys, time, fcntl, termios, struct

user, demo, out = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = ["hello.sh", "variables.sh", "quotes.sh", "args.sh", "greet.sh", "check.sh", "grade.sh",
           "loops.sh", "while.sh", "functions.sh", "backup.sh", "report.sh"]
extra = os.environ.get("EXTRA_DIR")            # e.g. solutions/ for the lab-sheet answers

stage = "/tmp/w14_stage"
shutil.rmtree(stage, ignore_errors=True); os.makedirs(stage)
for f in SCRIPTS:
    shutil.copy(os.path.join(here, f), stage)
if extra:
    for f in sorted(os.listdir(os.path.join(here, extra))):
        if f.endswith(".sh"):
            shutil.copy(os.path.join(here, extra, f), stage)
os.chmod(stage, 0o755)
for f in os.listdir(stage):
    os.chmod(os.path.join(stage, f), 0o644)
open("/tmp/w14_inputrc", "w").write("set enable-bracketed-paste off\nset horizontal-scroll-mode off\n")
os.chmod("/tmp/w14_inputrc", 0o644)

subprocess.run(["su", "-", user, "-c",
                "export LC_ALL=C.UTF-8; bash ~/mcmp117_lab_setup.sh >/dev/null; "
                f"for f in {stage}/*.sh; do install -m 664 \"$f\" ~/lab/scripts/; done"], check=True)

PS1 = r"student@okan-lab:\w\$ "
inner = (f"cd ~/lab/scripts && exec env PS1='{PS1}' INPUTRC=/tmp/w14_inputrc LC_ALL=C.UTF-8 "
         "TERM=dumb bash --norc --noprofile -i")
pid, fd = pty.fork()
if pid == 0:
    os.execvp("su", ["su", "-", user, "-c", inner])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 50, 200, 0, 0))

buf = ""
prompt_re = re.compile(r"student@okan-lab:[^\n]*\$ $")

def read_some(timeout):
    global buf
    r, _, _ = select.select([fd], [], [], timeout)
    if not r:
        return False
    try:
        data = os.read(fd, 65536).decode("utf-8", "replace")
    except OSError:
        return False
    buf += data
    return True

def wait_prompt(limit=60):
    t0 = time.time()
    while time.time() - t0 < limit:
        read_some(0.2)
        if prompt_re.search(buf.replace("\r", "")):
            return
    raise SystemExit("timeout waiting for prompt; buffer tail:\n" + buf[-500:])

def wait_idle(idle=0.6, limit=20):
    t0 = time.time(); last = time.time()
    while time.time() - t0 < limit:
        if read_some(0.1):
            last = time.time()
        elif time.time() - last > idle:
            return

def send(line):
    os.write(fd, (line + "\n").encode())

wait_prompt()
lines = [l.rstrip("\n") for l in open(demo, encoding="utf8")]
# setup first
for l in lines:
    if l.startswith("#setup:"):
        send(l[len("#setup:"):].strip()); time.sleep(0.05); wait_prompt()
time.sleep(0.2); read_some(0.1)
# start recording from the last prompt
m = list(prompt_re.finditer(buf.replace("\r", "")))
buf = buf.replace("\r", "")[m[-1].start():] if m else buf.replace("\r", "")
cmds = [l for l in lines if l.strip() and (not l.startswith("#") or l.startswith("#>")) and not l.startswith("#!")]
for i, l in enumerate(cmds):
    if l.startswith("#>"):
        send(l[2:].lstrip())
    else:
        send(l)
    nxt = cmds[i + 1] if i + 1 < len(cmds) else ""
    time.sleep(0.05)
    if nxt.startswith("#>"):
        wait_idle()
    else:
        wait_prompt()
send("exit")
time.sleep(0.3); read_some(0.3)

text = buf.replace("\r", "")
text = re.sub(r"\x1b\[[0-9;?]*[A-Za-z]", "", text)
text = re.sub(r"\n?student@okan-lab:[^\n]*\$ exit\n(exit\n?)?\s*$", "\n", text)
text = text.replace(user, "student")
host = socket.gethostname()
text = re.sub(r"\b%s\b" % re.escape(host), "okan-lab", text)
text = text.rstrip("\n") + "\n"
open(out, "w", encoding="utf8").write(text)
os.waitpid(pid, 0)
print("wrote", out, len(text.splitlines()), "lines")
