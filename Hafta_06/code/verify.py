#!/usr/bin/env python3
"""verify.py -- checks every number used in the Week 6 slides and notes.
Run:  python3 verify.py
"""

print("== 1. Base (relocation) + limit registers ==")
for base, limit, la in [(14000, 3000, 346), (14000, 3000, 2999), (14000, 3000, 3500)]:
    print(f"  base={base} limit={limit} logical={la}:",
          f"physical={base + la}" if la < limit else "TRAP (addressing error)")
for base, limit, la in [(0x4000, 0x1000, 0x02A4), (0x4000, 0x1000, 0x1200)]:
    print(f"  base={base:#06x} limit={limit:#06x} logical={la:#06x}:",
          f"physical={base + la:#06x} ({base + la})" if la < limit else "TRAP")
print(f"  0x4000 = {0x4000}, 0x1000 = {0x1000}, 0x02A4 = {0x02A4}, 0x1200 = {0x1200}")

print("\n== 2. Swapping ==")
size_mb, rate = 100, 50
t = size_mb / rate
print(f"  swap out {size_mb} MB at {rate} MB/s = {t} s; out + in = {2 * t} s")
page = 4096
print(f"  one 4 KB page at 50 MB/s (1 MB = 10^6 B): {page / 50e6 * 1e6:.1f} us")

print("\n== 3. 50-percent rule ==")
N = 1000
print(f"  N={N} allocated blocks, 0.5N={N // 2} lost -> fraction unusable = "
      f"{0.5 * N / (1.5 * N):.4f} (one third)")

print("\n== 4. Paging: split and translate (4 KB pages, 16-bit addresses) ==")
pt = {0: 5, 1: 9, 2: 1, 3: 7, 4: 12}
for la in (0x3A7F, 0x1234, 0x5000):
    p, d = la >> 12, la & 0xFFF
    print(f"  {la:#06x} = {la}: p={p}, d={d:#05x}={d}", end="")
    if p in pt:
        pa = pt[p] * 4096 + d
        print(f" -> frame {pt[p]} -> {pa:#06x} = {pa}  (check {pt[p]}*4096+{d})")
    else:
        print(" -> invalid")
print(f"  bits: m=16, n=12 -> p has {16 - 12} bits -> {2 ** 4} pages of {2 ** 12} B")
print(f"  32-bit, 4 KB: p has {32 - 12} bits -> {2 ** 20} pages")

print("\n== 5. Internal fragmentation in paging ==")
size = 10000
pages = -(-size // 4096)
print(f"  {size} B / 4096 = {size // 4096} full pages + {size % 4096} B -> {pages} frames,"
      f" waste {pages * 4096 - size} B")

print("\n== 6. Page-table size ==")
entries = 2 ** 32 // 2 ** 12
print(f"  32-bit, 4 KB pages: {entries} entries x 4 B = {entries * 4} B = {entries * 4 / 2**20} MB")
print(f"  100 processes -> {100 * entries * 4 / 2**20} MB")
print(f"  two-level 10+10+12: outer table {2**10} entries x 4 B = {2**10 * 4} B")
print(f"  x86-64 48-bit, 4 levels 9+9+9+9+12; one table = {2**9} x 8 B = {2**9 * 8} B")
print(f"  flat 48-bit table with 8-B entries: {2**36 * 8 / 2**30} GB")

print("\n== 7. TLB: effective access time ==")
tm, tt = 100, 20
for a in (0.80, 0.98, 0.99):
    eat = a * (tt + tm) + (1 - a) * (tt + 2 * tm)
    simp = a * tm + (1 - a) * 2 * tm
    print(f"  alpha={a}: EAT = {eat:.1f} ns  (= t_TLB + (2-a)t_m = {tt + (2 - a) * tm:.1f});"
          f" slowdown {100 * (eat / tm - 1):.0f}%;  simplified (t_TLB=0): {simp:.1f} ns")
print(f"  no TLB at all: 2*t_m = {2 * tm} ns")
print(f"  alpha=0.80 terms: {0.8 * 120:.1f} + {0.2 * 220:.1f}")
print(f"  alpha=0.98 terms: {0.98 * 120:.1f} + {0.02 * 220:.1f}")

print("\n== 8. Segmentation ==")
seg = {0: (2000, 1200), 1: (6500, 300), 2: (4800, 600), 3: (3400, 900), 4: (5600, 700)}
for s, (b, l) in sorted(seg.items()):
    print(f"  seg {s}: base {b}, limit {l}, occupies {b}-{b + l - 1}")
spans = sorted((b, b + l) for b, l in seg.values())
assert all(spans[i][1] <= spans[i + 1][0] for i in range(len(spans) - 1)), "overlap!"
for s, d in [(2, 53), (3, 852), (1, 299), (0, 1222)]:
    b, l = seg[s]
    print(f"  (s={s}, d={d}):", f"physical {b + d}" if d < l else f"TRAP ({d} >= limit {l})")
