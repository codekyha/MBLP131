#!/usr/bin/env python3
"""review_problems.py -- checks every number in the Week 8 slides and in the
worked examples / typical questions of the Study Guide (notes, Sections 2-8).

Run:   python3 review_problems.py          (prints everything)
       python3 review_problems.py --json   (also writes review_results.json,
                                            which build_deck.js reads)
"""
import json, sys
from math import log, ceil
from osim import *

lines = []
def out(s=""):
    lines.append(s); print(s)

R = {}

# ----------------------------------------------------------------- Week 1
out("== Problem 1a / Week 1: multiprogramming and batch utilisation ==")
p = 0.6
for n in (1, 3, 6):
    out(f"  U({n}) = 1 - {p}^{n} = {u_multiprog(p, n):.4f}")
nmin = ceil(log(0.05) / log(p))
out(f"  U >= 95%: n >= ln 0.05 / ln {p} = {log(0.05) / log(p):.3f} -> n = {nmin}"
    f"  (0.6^5 = {p**5:.4f}, 0.6^6 = {p**6:.4f})")
tr, ts = 4, 6
out(f"  batch: U = {tr}/({tr}+{ts}) = {tr / (tr + ts):.2f}; with t_setup = 1: {tr / (tr + 1):.2f}")
n_users, q = 30, 20
out(f"  time-sharing: n q = {n_users} x {q} ms = {n_users * q} ms")
R["w1"] = dict(p=p, U1=u_multiprog(p, 1), U3=u_multiprog(p, 3), nmin=nmin)

# ----------------------------------------------------------------- Week 2
out("\n== Week 2: microkernel cost, polling ==")
ts_, tc, tw = 0.1, 0.15, 2.0
tm_, tmu = 2 * ts_ + tw, 4 * ts_ + 2 * tc + tw
out(f"  t_w = {tw} us: T_mono = {tm_:.2f} us, T_micro = {tmu:.2f} us, ratio = {tmu / tm_:.3f}")
f, tchk = 200, 5e-6
out(f"  polling 200/s x 5 us = {f * tchk:.4f} = {100 * f * tchk:.2f} % of the CPU")

# ----------------------------------------------------------------- Week 3
out("\n== Problem 1b,c / Week 3: context-switch overhead and fork() ==")
for s_us, q_us in ((4, 2000), (4, 50)):
    out(f"  s = {s_us} us, q = {q_us} us: s/(q+s) = {s_us}/{q_us + s_us} = "
        f"{100 * cs_overhead(s_us, q_us):.3f} %")
# fork(); fork(); printf("A\n"); fork(); printf("B\n");
procs = 1
procs *= 2; procs *= 2; a_count = procs
procs *= 2; b_count = procs
out(f"  fork(); fork(); printf A; fork(); printf B -> A x{a_count}, B x{b_count}, "
    f"{procs} processes ({procs - 1} created)")
real = real_fork_run(["fork", "fork", "A", "fork", "B"])
out(f"  real run with os.fork(): {real}")
R["w3"] = dict(cs1=cs_overhead(4, 2000), cs2=cs_overhead(4, 50), A=a_count, B=b_count)

# ----------------------------------------------------------------- Week 4
out("\n== Problem 1d / Week 4: Amdahl's law, S = 0.2 ==")
S = 0.2
for N in (2, 4, 8):
    out(f"  N = {N}: 1/({S} + {1 - S:.1f}/{N}) = {amdahl(S, N):.4f}")
out(f"  limit 1/S = {1 / S:.1f}")
# speedup 3 on 4 cores -> largest S
out("  speedup >= 3 on 4 cores: S <= 1/9 = %.4f" % (1 / 9))
R["w4"] = dict(S=S, N2=amdahl(S, 2), N4=amdahl(S, 4), N8=amdahl(S, 8))

# ----------------------------------------------------------------- Week 5
out("\n== Problem 2 / Week 5: CPU scheduling ==")
JOBS = [("P1", 0, 7, 2), ("P2", 2, 4, 1), ("P3", 3, 2, 4), ("P4", 5, 5, 3)]
out("  jobs (name, arrival, burst, priority): " + str(JOBS))
R["jobs"] = JOBS
for key, title, q in (("FCFS", "FCFS", None), ("SJF", "SJF (non-preemptive)", None),
                      ("SRTF", "SRTF", None), ("PRIO_P", "Priority (preemptive)", None),
                      ("RR", "Round Robin q = 3", 3)):
    segs = schedule(JOBS, key, q)
    R[key] = show_schedule(title, JOBS, segs, out)

out("\n== Week 5: exponential averaging, alpha = 0.5, tau0 = 8, bursts 6, 10, 4 ==")
taus = [8]
for t in (6, 10, 4):
    taus.append(0.5 * t + 0.5 * taus[-1])
out("  tau = " + ", ".join(fmt(x) for x in taus))

out("\n== Problem 3 / Week 5: counter = 10, A: counter++, B: counter-- ==")
A_ops = [("load", None), ("add", +1), ("store", None)]
B_ops = [("load", None), ("add", -1), ("store", None)]
results = {}
for seq in interleavings(A_ops, B_ops):
    v = run_counter(seq, 10)
    results[v] = results.get(v, 0) + 1
out(f"  {sum(results.values())} interleavings; final values: "
    + ", ".join(f"{v}: {c} orders" for v, c in sorted(results.items())))
R["race"] = {str(k): v for k, v in sorted(results.items())}

out("\n== Problem 3 / Week 5: counting semaphore S = 2, three threads ==")
S_val, holders, queue = 2, [], []
def wait(t):
    global S_val
    if S_val > 0:
        S_val -= 1; holders.append(t); out(f"  {t} wait   -> enters,  S = {S_val}")
    else:
        queue.append(t); out(f"  {t} wait   -> blocks,  S = {S_val}, queue {queue}")
def signal(t):
    global S_val
    holders.remove(t); S_val += 1
    msg = f"  {t} signal -> S = {S_val}"
    if queue:
        w = queue.pop(0); S_val -= 1; holders.append(w)
        msg += f"; {w} leaves its wait, S = {S_val}"
    out(msg)
for op, t in (("w", "T1"), ("w", "T2"), ("w", "T3"), ("s", "T1"), ("s", "T2"), ("s", "T3")):
    wait(t) if op == "w" else signal(t)

# ----------------------------------------------------------------- Week 6
out("\n== Week 6: base and limit ==")
base, limit = 12000, 2500
for a in (100, 2499, 2500):
    out(f"  base {base}, limit {limit}, a = {a}: " + (f"{base + a}" if a < limit else "TRAP"))
out(f"  swap 200 MB at 80 MB/s: {200 / 80} s each way, {2 * 200 / 80} s out + in")

out("\n== Problem 4 / Week 6: first-, best-, worst-fit ==")
HOLES = [(100, 300), (500, 600), (1300, 200), (1700, 450), (2400, 350)]
REQ = [("A", 340), ("B", 180), ("C", 420), ("D", 500)]
out("  holes: " + ", ".join(f"{h}@{s}" for s, h in HOLES) + f" | total {sum(h for _, h in HOLES)} KB")
R["fit"] = dict(holes=HOLES, req=REQ)
for rule in ("first", "best", "worst"):
    placed, left = fit_run(HOLES, REQ, rule, out)
    R["fit"][rule] = dict(placed=placed, left=left)

out("\n== Problem 5 / Week 6: paging, 16-bit addresses, 4 KB pages ==")
PT = {0: 3, 1: 8, 2: 6, 4: 10, 5: 2}
out("  page table: " + ", ".join(f"{k}->{v}" for k, v in PT.items()) + ", 3 and 6..15 invalid")
for a in (0x1C3B, 0x4F0E, 0x2010, 0x3004):
    p_, d_, f_, pa = translate(a, 12, PT)
    out(f"  {a:#06x} = {a:5}: p = {p_}, d = {d_:#05x} = {d_:4}, " +
        (f"frame {f_} -> {pa:#06x} = {pa} (= {f_} x 4096 + {d_})" if f_ is not None else "invalid -> TRAP"))
out(f"  process of 9000 B: {9000 // 4096} full pages + {9000 % 4096} B -> {ceil(9000 / 4096)} frames, "
    f"internal fragmentation {ceil(9000 / 4096) * 4096 - 9000} B")
out(f"  page table, 32-bit addresses, 8 KB pages, 4-B entries: 2^19 = {2**19} entries, "
    f"{2**19 * 4} B = {2**19 * 4 / 2**20:.0f} MB")
tt, tm = 10, 80
for al in (0.95,):
    out(f"  TLB: t_TLB = {tt}, t_m = {tm}, alpha = {al}: EAT = {al}x{tt + tm} + {1 - al:.2f}x{tt + 2 * tm}"
        f" = {eat_tlb(al, tt, tm):.2f} ns = t_TLB + (2-a)t_m = {tt + (2 - al) * tm:.2f};"
        f" simplified {al * tm + (1 - al) * 2 * tm:.2f} ns; no TLB {2 * tm} ns")
alpha_needed = 2 - (100 - tt) / tm
out(f"  EAT = 100 ns needs alpha = 2 - 90/80 = {alpha_needed:.3f}")
R["tlb"] = dict(tt=tt, tm=tm, a=0.95, eat=eat_tlb(0.95, tt, tm), need=alpha_needed)

out("\n== Week 6: segment table ==")
SEG = {0: (1000, 800), 1: (5200, 300), 2: (2400, 1500)}
for s_, d_ in ((2, 1499), (1, 300), (0, 799)):
    b, l = SEG[s_]
    out(f"  <{s_}, {d_}>: limit {l}: " + (f"{b} + {d_} = {b + d_}" if d_ < l else "TRAP"))

# ----------------------------------------------------------------- Week 7
out("\n== Problem 6 / Week 7: page replacement, 3 frames ==")
REFS = [1, 2, 0, 4, 2, 3, 2, 1, 2, 4, 0, 2, 0, 1]
R["refs"] = REFS
assert not opt_ties(REFS, 3)
for pol in ("FIFO", "LRU", "OPT"):
    n, rows = show_replacement(REFS, 3, pol, out)
    R["repl_" + pol] = dict(faults=n, frames=[r[1] for r in rows],
                            fault=[r[2] for r in rows], victim=[r[3] for r in rows])
    out("")
for pol in ("FIFO", "LRU", "OPT"):
    out(f"  4 frames, {pol}: {replace(REFS, 4, pol)[0]} faults")

out("\n== Problem 7 / Week 7: EAT with page faults ==")
tm, tf = 100, 6_000_000
p = 0.0002
eat = eat_fault(p, tm, tf)
out(f"  EAT = {1 - p:.4f} x {tm} + {p} x {tf:,} = {(1 - p) * tm:.2f} + {p * tf:.1f} = {eat:.2f} ns"
    f" -> {eat / tm:.1f} x slower")
pmax = 0.05 * tm / (tf - tm)
out(f"  slow-down < 5 %: p < 5/{tf - tm:,} = {pmax:.3e} (1 fault per {1 / pmax:,.0f} accesses)")
R["pf"] = dict(tm=tm, tf=tf, p=p, eat=eat, pmax=pmax)

out("\n== Problem 7 / Week 7: direct access, 120-B records, 4096-B blocks ==")
for k in (750, 40):
    off, blk, inblk, lastblk = block_of(k, 120, 4096)
    out(f"  record {k}: byte {off:,}; block {off}//4096 = {blk}; offset {off} - {blk} x 4096 = {inblk};"
        f" last byte {off + 119:,} in block {lastblk}" + ("  -> CROSSES a block boundary" if lastblk != blk else ""))
R["blk"] = dict(zip(("off", "blk", "inblk", "last"), block_of(750, 120, 4096)))

out("\n== Week 7: working set demand ==")
wss = [4, 6, 3, 5]
out(f"  WSS = {wss}: D = {sum(wss)}; m = 16 frames -> " + ("thrashing" if sum(wss) > 16 else "ok"))

out("\n== Quiz (slides) ==")
out(f"  arrival 3, burst 4, finish 15: turnaround {15 - 3}, waiting {15 - 3 - 4}")
p_, d_, f_, pa = translate(0x2ABC, 12, PT)
out(f"  0x2ABC: p = {p_}, d = {d_:#05x}, frame {f_} -> {pa:#06x}")
out(f"  t_TLB = 10, t_m = 100, alpha = 0.9: EAT = {eat_tlb(0.9, 10, 100):.1f} ns")

if "--json" in sys.argv:
    with open("review_results.json", "w") as fh:
        json.dump(R, fh, indent=1, default=str)
    out("\nwrote review_results.json")
