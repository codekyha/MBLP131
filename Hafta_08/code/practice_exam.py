#!/usr/bin/env python3
"""practice_exam.py -- checks every number in the Practice Exam of the Week 8
Study Guide (notes, Sections "Practice Exam" and "Worked Solutions").
Run:  python3 practice_exam.py
"""
from osim import *

out = print

out("== B2: context-switch overhead, s = 5 us, q = 10 ms ==")
out(f"  5/(10000+5) = {100 * cs_overhead(5, 10000):.4f} %")

out("\n== C1: CPU scheduling ==")
JOBS = [("P1", 0, 8, 0), ("P2", 1, 4, 0), ("P3", 2, 2, 0), ("P4", 4, 5, 0)]
out("  jobs (name, arrival, burst): " + str([j[:3] for j in JOBS]))
for key, title, q in (("FCFS", "(a) FCFS", None), ("SRTF", "(b) SRTF", None),
                      ("RR", "(c) Round Robin q = 4", 4)):
    show_schedule(title, JOBS, schedule(JOBS, key, q), out)

out("\n== C2: paging, 16-bit addresses, 1 KB pages ==")
out(f"  offset bits n = 10, page bits = 16 - 10 = 6 -> {2**6} pages")
PT = {0: 7, 1: 2, 2: 9, 4: 5}
for a in (2100, 4500, 3100, 1023):
    p_, d_, f_, pa = translate(a, 10, PT)
    out(f"  a = {a}: p = {a}//1024 = {p_}, d = {a} - {p_} x 1024 = {d_}; " +
        (f"frame {f_} -> {f_} x 1024 + {d_} = {pa}" if f_ is not None else "page invalid -> TRAP"))
tt, tm, al = 5, 100, 0.9
out(f"  EAT = {al} x {tt + tm} + {1 - al:.1f} x {tt + 2 * tm} = {eat_tlb(al, tt, tm):.2f} ns"
    f" (= {tt} + (2 - {al}) x {tm})")
need = 2 - (110 - tt) / tm
out(f"  EAT = 110 ns: 5 + (2 - a) 100 = 110 -> a = {need:.2f}")

out("\n== C3: page replacement, 3 frames ==")
REFS = [4, 1, 2, 4, 3, 5, 1, 3, 2, 4, 3, 5]
assert not opt_ties(REFS, 3)
for pol in ("FIFO", "LRU", "OPT"):
    show_replacement(REFS, 3, pol, out)
    out("")

out("== C4: first-, best-, worst-fit ==")
HOLES = [(200, 250), (600, 500), (1300, 150), (1600, 400), (2200, 300)]
REQ = [("A", 210), ("B", 380), ("C", 290), ("D", 450)]
out("  holes: " + ", ".join(f"{h}@{s}" for s, h in HOLES) + f" | total {sum(h for _, h in HOLES)} KB")
for rule in ("first", "best", "worst"):
    fit_run(HOLES, REQ, rule, out)

out("\n== C5a: EAT with page faults ==")
tm, tf, p = 150, 5_000_000, 0.0004
eat = eat_fault(p, tm, tf)
out(f"  EAT = {1 - p:.4f} x {tm} + {p} x {tf:,} = {(1 - p) * tm:.2f} + {p * tf:.1f} = {eat:.2f} ns"
    f" ({eat / tm:.2f} x t_m)")
pmax = 0.2 * tm / (tf - tm)
out(f"  slow-down < 20 %: 150 + p({tf:,} - 150) < 180 -> p < 30/{tf - tm:,} = {pmax:.3e}"
    f" (1 per {1 / pmax:,.0f})")

out("\n== C5b: Amdahl, S = 0.3 ==")
for N in (4, 10):
    out(f"  N = {N}: 1/(0.3 + 0.7/{N}) = 1/{0.3 + 0.7 / N:.4f} = {amdahl(0.3, N):.4f}")
out(f"  limit 1/0.3 = {1 / 0.3:.4f}")
