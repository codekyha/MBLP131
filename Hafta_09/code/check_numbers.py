#!/usr/bin/env python3
"""check_numbers.py -- Week 9: verifies the numbers quoted on the slides and in the notes.

Run it after the lab setup script:   python3 check_numbers.py   (uses ~/lab)
  1. directory link counts: 2 + number of subdirectories
  2. how `ls -h` turns bytes into K (powers of 1024, always rounded UP)
  3. the "total" line of `ls -l` (allocated space in 1 KiB units)
  4. how many entries ls -a / getdents64 sees in docs/
"""
import math
import os
import sys

lab = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/lab")


def human(n):
    """Imitate GNU ls -h: powers of 1024, round up, one decimal below 10."""
    if n < 1024:
        return str(n)
    for unit in "KMGT":
        n /= 1024
        if n < 10:
            v = math.ceil(n * 10) / 10
            if v < 10:
                return f"{v:.1f}{unit}"
        if n < 1024 or unit == "T":
            return f"{math.ceil(n)}{unit}"


print("1) directory link counts (2 + subdirectories)")
for d in ["", "projects", "projects/alpha", "docs"]:
    p = os.path.join(lab, d)
    sub = sum(1 for e in os.scandir(p) if e.is_dir(follow_symlinks=False))
    print(f"   {('lab/' + d).rstrip('/'):18s} subdirs={sub}  2+{sub}={2 + sub}  st_nlink={os.stat(p).st_nlink}")

print("2) ls -h sizes")
for f in ["logs/access.log", "logs/system.log", "data/students.csv", "data/cities.txt"]:
    n = os.path.getsize(os.path.join(lab, f))
    print(f"   {f:18s} {n:6d} bytes = {n / 1024:7.3f} KiB -> ls -h shows {human(n)}")

print("3) 'total' of ls -l (st_blocks are 512-byte units; ls shows 1 KiB units)")
for d in ["", "docs", "logs"]:
    p = os.path.join(lab, d)
    tot = sum(os.lstat(e.path).st_blocks for e in os.scandir(p) if not e.name.startswith("."))
    print(f"   {('lab/' + d).rstrip('/'):18s} total {tot // 2}")

print("4) entries in docs/ including . and ..")
names = os.listdir(os.path.join(lab, "docs"))
print(f"   {len(names)} names + . + .. = {len(names) + 2}  (hidden: {[n for n in names if n.startswith('.')]})")
