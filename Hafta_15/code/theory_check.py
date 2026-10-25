#!/usr/bin/env python3
"""theory_check.py -- verifies EVERY theory number used in Week 15
(final-exam review): the deck's worked problems (D*), the Practice Final in the
study guide (N*) and the Sample Final paper / answer key (S*).

Run:   python3 theory_check.py            -> prints all results (out_theory_check.txt)
       python3 theory_check.py --json     -> also writes theory_results.json (read by build_deck.js)

Conventions are exactly those of Weeks 1-7:
  * Scheduling (Week 5): times in ms, context-switch time 0, ties broken by
    arrival time then by name, a SMALLER priority number = HIGHER priority,
    Round Robin: a process arriving at the instant a quantum expires enters the
    ready queue BEFORE the preempted process.
    T_turnaround = T_completion - T_arrival, T_waiting = T_turnaround - T_burst,
    T_response = T_first run - T_arrival (Week 4).
  * TLB (Week 6, "our convention"): EAT = t_TLB + (2 - alpha) * t_m.
  * Page faults (Week 7): EAT = (1 - p) * t_m + p * t_fault.
  * Paging (Week 6): p = floor(a / 2^n), d = a mod 2^n, a_phys = f * 2^n + d.
"""
import json, math, sys

OUT = {}

# =========================================================== scheduling (W5)
def metrics(jobs, segs):
    res = {}
    for name, arr, burst, prio in jobs:
        mine = [s for s in segs if s[0] == name]
        first = min(s[1] for s in mine); done = max(s[2] for s in mine)
        tat = done - arr
        res[name] = dict(arrival=arr, burst=burst, priority=prio, first=first,
                         completion=done, turnaround=tat, waiting=tat - burst,
                         response=first - arr)
    n = len(jobs)
    avg = {k: sum(r[k] for r in res.values()) / n for k in ("waiting", "turnaround", "response")}
    return res, avg


def merge(segs):
    out = []
    for s in segs:
        if out and out[-1][0] == s[0] and out[-1][2] == s[1]:
            out[-1] = (s[0], out[-1][1], s[2])
        else:
            out.append(s)
    return out


def nonpreemptive(jobs, key):
    t, segs, left = 0, [], list(jobs)
    while left:
        ready = [j for j in left if j[1] <= t]
        if not ready:
            t = min(j[1] for j in left); continue
        j = min(ready, key=key)
        segs.append((j[0], t, t + j[2])); t += j[2]; left.remove(j)
    return segs


def preemptive(jobs, key):
    rem = {j[0]: j[2] for j in jobs}
    t, segs = 0, []
    while any(rem.values()):
        ready = [j for j in jobs if j[1] <= t and rem[j[0]] > 0]
        if not ready:
            t += 1; continue
        j = min(ready, key=lambda j: key(j, rem))
        segs.append((j[0], t, t + 1)); rem[j[0]] -= 1; t += 1
    return merge(segs)


def round_robin(jobs, q):
    rem = {j[0]: j[2] for j in jobs}
    arrivals = sorted(jobs, key=lambda j: (j[1], j[0]))
    queue, t, segs, i = [], 0, [], 0

    def admit(upto):
        nonlocal i
        while i < len(arrivals) and arrivals[i][1] <= upto:
            queue.append(arrivals[i][0]); i += 1
    admit(t)
    while queue or i < len(arrivals):
        if not queue:
            t = arrivals[i][1]; admit(t); continue
        p = queue.pop(0)
        run = min(q, rem[p])
        segs.append((p, t, t + run)); t += run; rem[p] -= run
        admit(t)
        if rem[p] > 0:
            queue.append(p)
    return merge(segs)


ALGOS = {
    "FCFS":   lambda J: nonpreemptive(J, key=lambda j: (j[1], j[0])),
    "SJF":    lambda J: nonpreemptive(J, key=lambda j: (j[2], j[1], j[0])),
    "SRTF":   lambda J: preemptive(J, key=lambda j, rem: (rem[j[0]], j[1], j[0])),
    "PRIO_NP": lambda J: nonpreemptive(J, key=lambda j: (j[3], j[1], j[0])),
    "PRIO_P": lambda J: preemptive(J, key=lambda j, rem: (j[3], j[1], j[0])),
}


def sched(tag, jobs, algo, q=None):
    segs = round_robin(jobs, q) if algo == "RR" else ALGOS[algo](jobs)
    res, avg = metrics(jobs, segs)
    name = f"{algo}{q if q else ''}"
    print(f"--- {tag}: {name}")
    print("    Gantt: " + " ".join(f"[{a}-{b} {p}]" for p, a, b in segs))
    print(f"    {'':4}{'arr':>5}{'burst':>6}{'prio':>5}{'first':>6}{'done':>6}{'TAT':>5}{'wait':>5}{'resp':>5}")
    for n, r in res.items():
        print(f"    {n:4}{r['arrival']:5}{r['burst']:6}{r['priority']:5}{r['first']:6}"
              f"{r['completion']:6}{r['turnaround']:5}{r['waiting']:5}{r['response']:5}")
    print(f"    sums: TAT {sum(r['turnaround'] for r in res.values())}, wait "
          f"{sum(r['waiting'] for r in res.values())}, resp {sum(r['response'] for r in res.values())}"
          f"  -> avg wait {avg['waiting']:.2f}, avg TAT {avg['turnaround']:.2f}, "
          f"avg resp {avg['response']:.2f}, switches {len(segs) - 1}")
    OUT[f"{tag}_{name}"] = dict(segs=segs, per=res, avg=avg, switches=len(segs) - 1)
    return segs, res, avg


# =========================================================== page replacement (W7)
def simulate(refs, nframes, policy):
    frames, faults, rows, queue, last_use = [], 0, [], [], {}
    for t, p in enumerate(refs):
        fault = p not in frames
        if fault:
            faults += 1
            if len(frames) < nframes:
                frames.append(p)
            else:
                if policy == "FIFO":
                    victim = queue.pop(0)
                elif policy == "LRU":
                    victim = min(frames, key=lambda q: last_use[q])
                else:  # OPT
                    rest = refs[t + 1:]
                    victim = max(frames, key=lambda q: rest.index(q) if q in rest else math.inf)
                frames[frames.index(victim)] = p
            if policy == "FIFO":
                queue.append(p)
        last_use[p] = t
        rows.append((p, list(frames), fault))
    return faults, rows


def repl(tag, refs, n):
    print(f"--- {tag}: reference string {refs}, {n} frames")
    res = {}
    for pol in ("FIFO", "OPT", "LRU"):
        faults, rows = simulate(refs, n, pol)
        res[pol] = dict(faults=faults, frames=[r[1] for r in rows], fault=[r[2] for r in rows])
        print(f"    {pol:4}: {faults:2} faults, hits {len(refs) - faults}")
        print("      ref   " + " ".join(f"{p:>2}" for p in refs))
        for k in range(n):
            print(f"      fr{k}   " + " ".join(f"{r[1][k]:>2}" if k < len(r[1]) else " ." for r in rows))
        print("      fault " + " ".join(" F" if r[2] else "  " for r in rows))
    OUT[tag] = dict(refs=refs, n=n, **res)
    return res


# =========================================================== helpers
def show(label, value, unit=""):
    print(f"    {label} = {value}{(' ' + unit) if unit else ''}")


def eat_tlb(t_tlb, t_m, alpha):          # Week 6, our convention
    return t_tlb + (2 - alpha) * t_m


def eat_fault(t_m, t_fault, p):           # Week 7
    return (1 - p) * t_m + p * t_fault


def amdahl(S, N):                         # Week 4
    return 1 / (S + (1 - S) / N)


def fits(holes, requests):                # Week 6 placement algorithms
    out = {}
    for algo in ("first", "best", "worst"):
        h = list(holes); placed = []
        for r in requests:
            cand = [i for i, x in enumerate(h) if x >= r]
            if not cand:
                placed.append((r, None, None)); continue
            if algo == "first":
                i = cand[0]
            elif algo == "best":
                i = min(cand, key=lambda i: (h[i], i))
            else:
                i = max(cand, key=lambda i: (h[i], -i))
            placed.append((r, i, h[i])); h[i] -= r
        out[algo] = dict(placed=placed, holes_after=h)
        print(f"    {algo:5}-fit: " + ", ".join(
            f"{r}->{'hole#%d(%d)' % (i + 1, s) if i is not None else 'MUST WAIT'}" for r, i, s in placed)
            + f" | holes after {h}")
    return out


def paging(tag, a, page_bits, table):
    size = 2 ** page_bits
    p, d = a // size, a % size
    f = table[p]
    phys = f * size + d
    print(f"    {tag}: a = {a} (0x{a:X}), page size {size}: p = {p}, d = {d} (0x{d:X}), "
          f"frame {f}, a_phys = {f}*{size}+{d} = {phys} (0x{phys:X})")
    OUT[tag] = dict(a=a, size=size, p=p, d=d, f=f, phys=phys)
    return p, d, f, phys


def block(tag, rec, recsize, blksize):
    off = rec * recsize
    b, o = off // blksize, off % blksize
    last = off + recsize - 1
    print(f"    {tag}: record {rec} x {recsize} B = byte {off}; block {off}//{blksize} = {b}, "
          f"offset {o}; last byte {last} in block {last // blksize} "
          f"-> {'fits in one block' if last // blksize == b else 'CROSSES a block boundary'}")
    OUT[tag] = dict(offset=off, block=b, inblock=o, last=last, lastblock=last // blksize)


# ============================================================================
if __name__ == "__main__":
    print("=" * 78)
    print("PART D -- worked problems on the Week 15 slides")
    print("=" * 78)
    # D1 scheduling
    D1 = [("P1", 0, 5, 3), ("P2", 1, 3, 1), ("P3", 2, 1, 4), ("P4", 3, 4, 2)]
    for a in ("SRTF",):
        sched("D1", D1, a)
    sched("D1", D1, "RR", 2)
    # D2 paging + TLB
    print("--- D2: paging, page size 1 KB = 2^10, page table [5, 2, 7, 1]")
    paging("D2", 2500, 10, [5, 2, 7, 1])
    e = eat_tlb(10, 100, 0.9)
    show("D2 EAT = t_TLB + (2-alpha) t_m = 10 + (2-0.9)*100", round(e, 4), "ns")
    show("D2 hit 0.9*(10+100), miss 0.1*(10+200)", f"{0.9*110:.1f} + {0.1*210:.1f}")
    alpha = 2 - (115 - 10) / 100
    show("D2 alpha needed for EAT = 115 ns", round(alpha, 4))
    OUT["D2"].update(eat=e, alpha115=alpha)
    # D3 page replacement
    repl("D3", [3, 5, 1, 0, 3, 1, 0, 3, 1, 4, 1, 0], 3)
    # D4 page-fault EAT + block arithmetic
    print("--- D4: page-fault EAT and block arithmetic")
    e = eat_fault(100, 10_000_000, 0.0002)
    show("D4 EAT(p=0.0002), t_m=100 ns, t_fault=10 ms", round(e, 4), f"ns  (slowdown x{e/100:.2f})")
    pmax = 0.10 * 100 / (10_000_000 - 100)
    show("D4 p for slowdown < 10%  p <", f"{pmax:.4e}", f"(1 fault per {1/pmax:,.0f} accesses)")
    OUT["D4"] = dict(eat=e, pmax=pmax)
    block("D4b", 75, 128, 4096)
    # D5 quick formulas
    print("--- D5: quick formulas (W1, W3, W4)")
    u = 1 - 0.6 ** 3; show("D5 U(3) = 1 - 0.6^3", round(u, 4))
    ub = 2 / (2 + 3); show("D5 U = t_run/(t_run+t_setup), 2 min / 3 min", round(ub, 4))
    sp = amdahl(0.2, 4); show("D5 Amdahl S=0.2 N=4", round(sp, 4), f"(limit 1/S = {1/0.2:.0f})")
    ov = 0.1 / (4 + 0.1); show("D5 overhead s/(q+s), s=0.1 ms, q=4 ms", f"{100*ov:.2f} %")
    show("D5 forks in a loop, n = 3 -> processes 2^3", 2 ** 3, f"(created by fork: {2**3 - 1})")
    OUT["D5"] = dict(u=u, ub=ub, amdahl=sp, overhead=ov)

    print()
    print("=" * 78)
    print("PART N -- Practice Final in the study guide (notes)")
    print("=" * 78)
    N1 = [("P1", 0, 8, 2), ("P2", 1, 4, 1), ("P3", 2, 9, 4), ("P4", 3, 5, 3)]
    for a in ("SJF", "SRTF"):
        sched("N1", N1, a)
    sched("N1", N1, "RR", 3)
    print("--- N2: placement, holes 300, 600, 350, 200, 750, 125 KB; requests 115, 500, 358, 200, 375")
    OUT["N2"] = fits([300, 600, 350, 200, 750, 125], [115, 500, 358, 200, 375])
    print("--- N3: paging, 4 KB pages, table {5: 9}")
    paging("N3", 0x5C21, 12, {5: 9})
    entries = 2 ** 32 // 2 ** 13
    show("N3 page table size, 32-bit, 8 KB pages, 4-byte PTE: entries 2^19", entries,
         f"x 4 B = {entries*4} B = {entries*4 // 2**20} MB")
    show("N3 internal fragmentation, process 30,000 B, 8 KB pages",
         f"pages {math.ceil(30000/8192)}, last page holds {30000 - 3*8192} B, lost {4*8192 - 30000}", "B")
    e = eat_tlb(20, 80, 0.95); show("N4 EAT t_TLB=20, t_m=80, alpha=0.95", round(e, 4), "ns")
    a = 2 - (110 - 20) / 80; show("N4 alpha for EAT = 110 ns", round(a, 4))
    OUT["N4"] = dict(eat=e, alpha=a)
    repl("N5", [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2], 3)
    e = eat_fault(150, 6_000_000, 0.0001)
    show("N6 EAT t_m=150, t_fault=6 ms, p=0.0001", round(e, 4), f"ns (slowdown x{e/150:.3f})")
    pmax = 0.05 * 150 / (6_000_000 - 150)
    show("N6 slowdown < 5%: p <", f"{pmax:.4e}", f"(1 fault per {1/pmax:,.0f} accesses)")
    OUT["N6"] = dict(eat=e, pmax=pmax)
    block("N7", 30, 200, 1024)
    show("N8 fork loop n = 4 -> processes", 2 ** 4, f"(created by fork {2**4 - 1})")
    sp = amdahl(0.1, 8); show("N9 Amdahl S=0.1 N=8", round(sp, 4), f"(limit {1/0.1:.0f})")
    u1, u2 = 1 - 0.75 ** 2, 1 - 0.75 ** 4
    show("N9 U(n)=1-0.75^n  n=2,4", f"{u1:.4f}, {u2:.4f}")
    n = next(n for n in range(1, 50) if 1 - 0.75 ** n >= 0.9); show("N9 smallest n with U >= 90 %", n, f"(U = {1-0.75**n:.4f})")
    OUT["N9"] = dict(amdahl=sp, u2=u1, u4=u2, n90=n)
    # semaphore: counting semaphore S = 2, five threads call wait()
    print("    N10 counting semaphore S=2, 5 threads wait(): 2 pass, 3 block; S = 0")
    taus = [12]
    for t in (8, 4, 10):
        taus.append(0.5 * t + 0.5 * taus[-1])
    show("N11 exp. averaging alpha=0.5 tau0=12 bursts 8,4,10 -> tau1..3", taus[1:])
    OUT["N11"] = taus

    print()
    print("=" * 78)
    print("PART S -- Sample Final paper (exam/) and its answer key")
    print("=" * 78)
    S1 = [("P1", 0, 6, 3), ("P2", 2, 2, 1), ("P3", 3, 7, 4), ("P4", 5, 3, 2)]
    sched("S1", S1, "FCFS")
    sched("S1", S1, "PRIO_P")
    sched("S1", S1, "RR", 2)
    print("--- S2: paging, page size 2 KB = 2^11, page table [3, 8, 6, 1]")
    paging("S2", 5000, 11, [3, 8, 6, 1])
    show("S2 logical address 9000 -> page", 9000 // 2048, "(page table has 4 entries -> invalid, trap)")
    e = eat_tlb(10, 90, 0.8); show("S2 EAT t_TLB=10, t_m=90, alpha=0.8", round(e, 4), "ns")
    OUT["S2"].update(eat=e)
    print("--- S3: placement, holes 200, 450, 100, 300, 500 KB; request 280 KB")
    OUT["S3"] = fits([200, 450, 100, 300, 500], [280])
    repl("S4", [5, 4, 1, 5, 0, 5, 4, 0, 2, 1, 0, 1], 3)
    e = eat_fault(100, 5_000_000, 0.0005)
    show("S5 EAT t_m=100, t_fault=5 ms, p=0.0005", round(e, 4), f"ns (slowdown x{e/100:.2f})")
    OUT["S5"] = dict(eat=e)
    block("S6", 100, 50, 512)
    u = 1 - 0.5 ** 4; show("S7 U(4) with p = 0.5", u)
    sp = amdahl(0.25, 3); show("S7 Amdahl S=0.25 N=3", round(sp, 4), "(limit 4)")
    show("S7 forks: n = 3 -> printf runs", 2 ** 3)
    ov = 0.2 / (10 + 0.2); show("S7 overhead s=0.2 ms q=10 ms", f"{100*ov:.2f} %")
    OUT["S7"] = dict(u=u, amdahl=sp, overhead=ov)

    print()
    print("=" * 78)
    print("PART Q -- quiz on the Week 15 slides")
    print("=" * 78)
    sched("Q1", [("P1", 0, 4, 0), ("P2", 1, 2, 0), ("P3", 2, 1, 0)], "SRTF")
    a = 0x3A7F; show("Q2 0x3A7F, 4 KB pages: p, d", f"0x{a >> 12:X}, 0x{a & 0xFFF:X}")
    show("Q3 umask 027: file 666 & ~027, dir 777 & ~027", f"{0o666 & ~0o027:o}, {0o777 & ~0o027:o}")

    if "--json" in sys.argv:
        with open("theory_results.json", "w") as f:
            json.dump(OUT, f, indent=1, default=lambda o: None if o == math.inf else o)
        print("\nwrote theory_results.json")
