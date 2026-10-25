#!/usr/bin/env python3
"""record_session.py -- type a demo script into a REAL interactive bash and
record what the terminal shows (used to capture the out_*.txt files of Week 13).

Job control (Ctrl+Z, fg, bg, jobs) only exists in an interactive shell that
owns a terminal, so the demos cannot simply be run with "bash demo.sh".
This helper opens a pseudo-terminal (pty), starts "bash -i" in it and types
the demo line by line, exactly as a student would.

Usage:   python3 record_session.py demo_jobs.sh out.txt [cols] [user]
(started by root with a user name, the recorder itself stays root, so it does
not show up in the user's own process listings; the shell runs as the user.)
Demo file syntax:
    any line          typed + Enter; then wait for the next prompt (max 3 s)
    #@key C-z         press Ctrl+Z   (also C-c)
    #@sleep N         wait N seconds without typing
    #@timeout N       wait at most N s for the prompt after the next line
    # comment         not typed (explanations for the reader)
"""
import os, pty, pwd, re, select, struct, sys, time, fcntl, termios

demo, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 80
user = pwd.getpwnam(sys.argv[4]) if len(sys.argv) > 4 else pwd.getpwuid(os.getuid())
PROMPT = re.compile(rb"student@okan-lab:[^\n]*\$ $")

pid, fd = pty.fork()
if pid == 0:                                   # child: becomes the shell
    if os.getuid() == 0 and user.pw_uid != 0:       # become the student
        os.initgroups(user.pw_name, user.pw_gid)
        os.setgid(user.pw_gid); os.setuid(user.pw_uid)
    env = {"HOME": user.pw_dir, "USER": user.pw_name,
           "LOGNAME": user.pw_name, "SHELL": "/bin/bash", "PATH": "/usr/local/bin:/usr/bin:/bin",
           "LC_ALL": "C.UTF-8", "TERM": "dumb"}
    # a login shell ("-bash", as after an ssh login) reads ~/.bash_profile:
    # we put only the course prompt there
    with open(os.path.join(env["HOME"], ".bash_profile"), "w") as f:
        f.write("PS1='student@okan-lab:\\w\\$ '\nset +o emacs\n")  # no readline:
        # the terminal echoes long lines unchanged (no horizontal scrolling)
    os.chdir(os.path.join(user.pw_dir, "lab"))
    os.execvpe("bash", ["-bash"], env)

fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, cols, 0, 0))
buf = bytearray()

def pump(timeout, until_prompt=True):
    """read terminal output for up to `timeout` s (stop early at a prompt)"""
    end, start = time.time() + timeout, len(buf)
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.05)
        if r:
            try:
                data = os.read(fd, 4096)
            except OSError:
                return
            buf.extend(data)
        elif until_prompt and PROMPT.search(bytes(buf[start:])):
            time.sleep(0.15)                   # let late messages arrive
            if not select.select([fd], [], [], 0.05)[0]:
                return

pump(3)                                        # first prompt
next_timeout = 3
for line in open(demo, encoding="utf8").read().splitlines():
    s = line.strip()
    if s.startswith("#@key"):
        key = s.split()[1]
        os.write(fd, {"C-z": b"\x1a", "C-c": b"\x03"}[key])
        pump(next_timeout); next_timeout = 3
    elif s.startswith("#@sleep"):
        pump(float(s.split()[1]), until_prompt=False)
    elif s.startswith("#@timeout"):
        next_timeout = float(s.split()[1])
    elif not s or s.startswith("#") or line.startswith("#!"):
        continue
    else:
        os.write(fd, line.encode() + b"\n")
        pump(next_timeout); next_timeout = 3

os.write(fd, b"exit\n"); pump(1, until_prompt=False)
text = buf.decode("utf8", "replace").replace("\r\n", "\n").replace("\r", "")
text = re.sub(r"\x1b\[[0-9;?]*[A-Za-z]", "", text)          # stray escapes
text = re.sub(r"student@okan-lab:[^\n]*\$ exit\n?.*\Z", "", text, flags=re.S)
open(out, "w", encoding="utf8").write(text.rstrip("\n") + "\n")
