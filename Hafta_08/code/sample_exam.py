#!/usr/bin/env python3
"""sample_exam.py -- checks every number in the sample midterm paper and its
answer key (exam/MCMP117_Midterm_Sample.tex, exam/MCMP117_Midterm_AnswerKey.tex).
Run:  python3 sample_exam.py
"""
from osim import *

out = print

out("== C1: CPU scheduling ==")
JOBS = [("A", 0, 6, 3), ("B", 2, 5, 2), ("C", 3, 2, 1), ("D", 5, 4, 4)]
out("  jobs (name, arrival, burst, priority): " + str(JOBS))
for key, title, q in (("SJF", "(a) SJF (non-preemptive)", None),
                      ("PRIO_P", "(b) Priority (preemptive)", None),
                      ("RR", "(c) Round Robin q = 3", 3)):
    show_schedule(title, JOBS, schedule(JOBS, key, q), out)

out("\n== C2a: base and limit (hexadecimal) ==")
base, limit = 0x6000, 0x0A00
for a in (0x09FF, 0x0A00, 0x0150):
    out(f"  {a:#06x}: " + (f"< limit -> {base:#06x} + {a:#06x} = {base + a:#06x} = {base + a}"
                          if a < limit else "not < limit -> TRAP"))
out(f"  legal range {base:#06x} .. {base + limit - 1:#06x}")

out("\n== C2b: segment table ==")
SEG = {0: (1400, 600), 1: (6300, 400), 2: (4300, 1100), 3: (3200, 1000)}
for s_, d_ in ((2, 1099), (1, 400), (3, 512)):
    b, l = SEG[s_]
    out(f"  <{s_}, {d_}>: limit {l}: " + (f"{b} + {d_} = {b + d_}" if d_ < l else "TRAP"))

out("\n== C2c: TLB hit ratio for EAT = 128 ns (t_TLB = 20, t_m = 100) ==")
need = 2 - (128 - 20) / 100
out(f"  20 + (2 - a) 100 = 128 -> a = {need:.2f}; check EAT = {eat_tlb(need, 20, 100):.2f} ns")
out(f"  without TLB: 2 x 100 = 200 ns")
out(f"  alpha = 0.8: EAT = 0.8 x 120 + 0.2 x 220 = {eat_tlb(0.8, 20, 100):.2f} ns = 20 + 1.2 x 100")

out("\n== C3: page replacement, 3 frames ==")
REFS = [1, 0, 4, 2, 1, 0, 1, 2, 3, 1, 2, 3]
assert not opt_ties(REFS, 3)
out(f"  distinct pages {sorted(set(REFS))} -> {len(set(REFS))} compulsory faults")
for pol in ("FIFO", "LRU", "OPT"):
    show_replacement(REFS, 3, pol, out)
    out("")

out("== C4: first-, best-, worst-fit ==")
HOLES = [(200, 650), (1100, 450), (1800, 200), (2200, 550), (3000, 250)]
REQ = [("A", 270), ("B", 290), ("C", 330), ("D", 510)]
out("  holes: " + ", ".join(f"{h}@{s}" for s, h in HOLES) + f" | total {sum(h for _, h in HOLES)} KB")
for rule in ("first", "best", "worst"):
    fit_run(HOLES, REQ, rule, out)

out("\n== C5a: direct access, 300-B records, 1024-B blocks ==")
for k in (45, 58):
    off, blk, inblk, last = block_of(k, 300, 1024)
    out(f"  record {k}: byte {off}; block {off}//1024 = {blk}; offset {off} - {blk} x 1024 = {inblk};"
        f" last byte {off + 299} in block {last}" + ("  -> CROSSES into the next block" if last != blk else ""))

out("\n== C5b: fork(); printf X; fork(); fork(); printf Y ==")
n = 1
n *= 2; x = n          # one fork before X
n *= 2; n *= 2         # two more forks before Y
out(f"  X printed {x} times, Y printed {n} times, {n} processes in total ({n - 1} created)")
real = real_fork_run(["fork", "X", "fork", "fork", "Y"])
out(f"  real run with os.fork(): {real}")

out("\n== C5c: context-switch overhead, s = 20 us, q = 5 ms ==")
out(f"  20/(5000+20) = {100 * cs_overhead(20, 5000):.3f} %")
