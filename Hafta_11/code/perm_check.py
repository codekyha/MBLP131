#!/usr/bin/env python3
"""perm_check.py -- verifies every octal/umask number used in the Week 11 slides and notes."""
def sym(m, d=False):              # 0o754 -> 'rwxr-xr--'
    return "".join(("r" if m >> (8 - i) & 1 else "-") if i % 3 == 0 else
                   ("w" if m >> (8 - i) & 1 else "-") if i % 3 == 1 else
                   ("x" if m >> (8 - i) & 1 else "-") for i in range(9))
def octal(s):                     # 'rwxr-x---' -> 0o750
    return sum(1 << (8 - i) for i, c in enumerate(s) if c != "-")

print("digit  bits  symbolic")
for n in range(8):
    print(f"  {n}    {n:03b}   {sym(n)[6:]}")

print("\nmode strings -> octal")
for s in ["rwxr-x---", "rw-r--r--", "rwx------", "rwxr-xr-x", "rw-rw-r--", "rwxr-xr--", "rw-r-----", "r--r--r--"]:
    print(f"  {s} = {octal(s):03o}  ({' + '.join(str(octal(s) >> k & 7) for k in (6, 3, 0))})")
print("\noctal -> mode strings")
for m in [0o640, 0o711, 0o775, 0o754, 0o600, 0o700, 0o755, 0o644, 0o750, 0o777]:
    print(f"  {m:03o} = {sym(m)}")

print("\numask: new mode = base AND (NOT umask);  compare with plain subtraction")
for u in [0o002, 0o022, 0o027, 0o077, 0o033, 0o007, 0o011]:
    f, d = 0o666 & ~u, 0o777 & ~u
    fs, ds = 0o666 - u, 0o777 - u
    print(f"  umask {u:03o}: file {f:03o} {sym(f)}   dir {d:03o} {sym(d, True)}"
          f"   | subtraction: file {fs:03o}{'  WRONG' if fs != f else ''}, dir {ds:03o}{'  WRONG' if ds != d else ''}")

print("\nbit-by-bit for umask 033 on a file")
print(f"  base       666 = {0o666:09b}")
print(f"  umask      033 = {0o033:09b}")
print(f"  NOT umask      = {~0o033 & 0o777:09b}")
print(f"  AND result     = {0o666 & ~0o033:09b} = {0o666 & ~0o033:03o}")
print(f"  (666 - 033 = {0o666 - 0o033:03o} would be rw--wx-wx: write+execute without read -- nonsense)")
print(f"\n2^3 = {2**3} combinations per class; 2^9 = {2**9} basic modes; with setuid/setgid/sticky 2^12 = {2**12}")
print(f"special: 4755 = {sym(0o755)} + setuid -> rwsr-xr-x;  1777 -> rwxrwxrwt;  2770 -> rwxrws---")
