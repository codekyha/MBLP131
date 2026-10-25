#!/usr/bin/env python3
"""osim.py -- small simulators shared by the Week 8 check scripts.

The rules are exactly those of the Week 5, 6 and 7 notes:
  * CPU scheduling (Week 5): times in ms, context-switch time 0, ties broken by
    arrival time and then by name, a SMALLER priority number = HIGHER priority,
    Round Robin puts a process that arrives when a quantum expires into the
    ready queue BEFORE the preempted process.
  * Placement (Week 6): holes in address order; the request is carved off the
    start of the chosen hole.
  * Page replacement (Week 7): FIFO, OPT (victim = used farthest in the future),
    LRU (victim = used longest ago); the new page goes into the victim's frame.
This file is imported by review_problems.py, practice_exam.py and sample_exam.py.
"""
from itertools import combinations
from math import floor

# =========================== CPU scheduling (Week 5) ===========================
# A job is a tuple (name, arrival, burst, priority).

def metrics(jobs, segs):
    """segs: list of (name, start, end). Returns per-process dict and averages."""
    res = {}
    for name, arr, burst, prio in jobs:
        mine = [s for s in segs if s[0] == name]
        first = min(s[1] for s in mine)
        done = max(s[2] for s in mine)
        tat = done - arr
        res[name] = dict(arrival=arr, burst=burst, priority=prio, first=first,
                         completion=done, turnaround=tat, waiting=tat - burst,
                         response=first - arr)
    n = len(jobs)
    avg = {k: sum(r[k] for r in res.values()) / n
           for k in ("waiting", "turnaround", "response")}
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
            t = min(j[1] for j in left)
            continue
        j = min(ready, key=key)
        segs.append((j[0], t, t + j[2]))
        t += j[2]
        left.remove(j)
    return segs


def preemptive(jobs, key):
    rem = {j[0]: j[2] for j in jobs}
    t, segs = 0, []
    while any(rem.values()):
        ready = [j for j in jobs if j[1] <= t and rem[j[0]] > 0]
        if not ready:
            t += 1
            continue
        j = min(ready, key=lambda j: key(j, rem))
        segs.append((j[0], t, t + 1))
        rem[j[0]] -= 1
        t += 1
    return merge(segs)


def round_robin(jobs, q):
    rem = {j[0]: j[2] for j in jobs}
    arrivals = sorted(jobs, key=lambda j: (j[1], j[0]))
    queue, t, segs, i = [], 0, [], 0

    def admit(upto):
        nonlocal i
        while i < len(arrivals) and arrivals[i][1] <= upto:
            queue.append(arrivals[i][0])
            i += 1

    admit(t)
    while queue or i < len(arrivals):
        if not queue:
            t = arrivals[i][1]
            admit(t)
            continue
        p = queue.pop(0)
        run = min(q, rem[p])
        segs.append((p, t, t + run))
        t += run
        rem[p] -= run
        admit(t)                      # newcomers enter BEFORE the preempted process
        if rem[p] > 0:
            queue.append(p)
    return merge(segs)


def fcfs(jobs):    return nonpreemptive(jobs, key=lambda j: (j[1], j[0]))
def sjf(jobs):     return nonpreemptive(jobs, key=lambda j: (j[2], j[1], j[0]))
def srtf(jobs):    return preemptive(jobs, key=lambda j, rem: (rem[j[0]], j[1], j[0]))
def prio_np(jobs): return nonpreemptive(jobs, key=lambda j: (j[3], j[1], j[0]))
def prio_p(jobs):  return preemptive(jobs, key=lambda j, rem: (j[3], j[1], j[0]))

ALGOS = {"FCFS": fcfs, "SJF": sjf, "SRTF": srtf, "PRIO_NP": prio_np,
         "PRIO_P": prio_p}


def schedule(jobs, algo, q=None):
    return round_robin(jobs, q) if algo == "RR" else ALGOS[algo](jobs)


def fmt(x):
    return str(int(x)) if float(x).is_integer() else f"{x:.2f}".rstrip("0")


def show_schedule(title, jobs, segs, out):
    res, avg = metrics(jobs, segs)
    busy = sum(b - a for _, a, b in segs)
    end = max(b for _, _, b in segs)
    out(f"--- {title} ---")
    out("Gantt: " + " ".join(f"[{a}-{b} {p}]" for p, a, b in segs))
    out(f"{'':5}{'arr':>4}{'burst':>6}{'prio':>5}{'first':>6}{'done':>5}"
        f"{'TAT':>5}{'wait':>5}{'resp':>5}")
    for n, r in res.items():
        out(f"{n:5}{r['arrival']:4}{r['burst']:6}{r['priority']:5}{r['first']:6}"
            f"{r['completion']:5}{r['turnaround']:5}{r['waiting']:5}{r['response']:5}")
    out(f"sum waiting {sum(r['waiting'] for r in res.values())}, "
        f"sum turnaround {sum(r['turnaround'] for r in res.values())}, "
        f"sum response {sum(r['response'] for r in res.values())}")
    out(f"avg waiting {fmt(avg['waiting'])}  avg turnaround {fmt(avg['turnaround'])}  "
        f"avg response {fmt(avg['response'])}  context switches {len(segs) - 1}  "
        f"CPU busy {busy}/{end} ms")
    return dict(segs=segs, per=res, avg=avg, switches=len(segs) - 1, end=end, busy=busy)


# ======================== Page replacement (Week 7) ============================

def replace(refs, nframes, policy):
    """Returns (faults, rows); rows = (page, frames after ref, fault?, victim)."""
    frames, faults, rows, queue, last = [], 0, [], [], {}
    for t, p in enumerate(refs):
        fault = p not in frames
        victim = None
        if fault:
            faults += 1
            if len(frames) < nframes:
                frames.append(p)
            else:
                if policy == "FIFO":
                    victim = queue.pop(0)
                elif policy == "LRU":
                    victim = min(frames, key=lambda q: last[q])
                else:  # OPT
                    rest = refs[t + 1:]
                    nxt = {q: (rest.index(q) if q in rest else float("inf")) for q in frames}
                    far = max(nxt.values())
                    ties = [q for q in frames if nxt[q] == far]
                    if len(ties) > 1 and far != float("inf"):
                        raise ValueError("OPT tie")          # cannot happen
                    victim = ties[0]
                frames[frames.index(victim)] = p
            if policy == "FIFO":
                queue.append(p)
        last[p] = t
        rows.append((p, list(frames), fault, victim))
    return faults, rows


def opt_ties(refs, nframes):
    """Positions where OPT had to choose between pages that are never used again."""
    frames, ties = [], []
    for t, p in enumerate(refs):
        if p in frames:
            continue
        if len(frames) < nframes:
            frames.append(p)
            continue
        rest = refs[t + 1:]
        never = [q for q in frames if q not in rest]
        if len(never) > 1:
            ties.append((t, never))
        nxt = {q: (rest.index(q) if q in rest else float("inf")) for q in frames}
        victim = max(frames, key=lambda q: nxt[q])
        frames[frames.index(victim)] = p
    return ties


def show_replacement(refs, n, policy, out, tag=""):
    faults, rows = replace(refs, n, policy)
    out(f"{tag}{policy}, {n} frames: {faults} page faults")
    out("ref   " + " ".join(f"{p:>2}" for p, *_ in rows))
    for k in range(n):
        out(f"fr{k}   " + " ".join(f"{fr[k]:>2}" if k < len(fr) else " ."
                                   for _, fr, _, _ in rows))
    out("fault " + " ".join(" F" if f else "  " for _, _, f, _ in rows))
    out("evict " + " ".join(f"{v:>2}" if v is not None else "  " for *_, v in rows))
    return faults, rows


# ====================== Memory allocation (Week 6) =============================

def fit_run(holes, requests, rule, out):
    """holes: [(start, size)] in address order; requests: [(name, size)]."""
    holes = list(holes)
    out(f"--- {rule}-fit ---")
    placed = {}
    for name, size in requests:
        fits = [i for i, (_, h) in enumerate(holes) if h >= size]
        if not fits:
            free = sum(h for _, h in holes)
            out(f"  {name} ({size} KB): no hole large enough -> waits "
                f"(free {free} KB, largest hole {max(h for _, h in holes)} KB)")
            placed[name] = None
            continue
        if rule == "first":
            i = fits[0]
        elif rule == "best":
            i = min(fits, key=lambda i: holes[i][1])
        else:
            i = max(fits, key=lambda i: holes[i][1])
        start, h = holes[i]
        out(f"  {name} ({size} KB) -> hole {h}@{start}, placed at "
            f"{start}-{start + size}, leftover {h - size} KB")
        placed[name] = (h, start, h - size)
        holes[i] = (start + size, h - size)
    holes = [(s, h) for s, h in holes if h > 0]
    out("  holes left: " + ", ".join(f"{h}@{s}" for s, h in holes)
        + f" | total free = {sum(h for _, h in holes)} KB")
    return placed, holes


# ========================= Formulas (Weeks 1-7) ================================

def u_multiprog(p, n):          # Week 1: U(n) = 1 - p^n
    return 1 - p ** n


def cs_overhead(s, q):          # Week 3/5: s / (q + s)
    return s / (q + s)


def amdahl(S, N):               # Week 4: 1 / (S + (1-S)/N)
    return 1 / (S + (1 - S) / N)


def eat_tlb(alpha, t_tlb, t_m):  # Week 6 course convention
    return alpha * (t_tlb + t_m) + (1 - alpha) * (t_tlb + 2 * t_m)


def eat_fault(p, t_m, t_fault):  # Week 7
    return (1 - p) * t_m + p * t_fault


def translate(addr, page_bits, table):
    """Week 6 paging: returns (p, d, frame or None, physical or None)."""
    p, d = addr >> page_bits, addr & ((1 << page_bits) - 1)
    f = table.get(p)
    return p, d, f, (None if f is None else (f << page_bits) | d)


def block_of(k, R, B):          # Week 7 direct access
    off = k * R
    return off, off // B, off - (off // B) * B, (off + R - 1) // B


# ====================== Synchronisation (Week 5) ===============================

def interleavings(a_ops, b_ops):
    """All interleavings of two instruction lists (order inside each kept)."""
    n, m = len(a_ops), len(b_ops)
    for pos in combinations(range(n + m), n):
        seq, ia, ib = [], 0, 0
        for k in range(n + m):
            if k in pos:
                seq.append(("A", a_ops[ia])); ia += 1
            else:
                seq.append(("B", b_ops[ib])); ib += 1
        yield seq


def run_counter(seq, start):
    """Each thread: load counter into its own register, add, store."""
    counter, reg = start, {}
    for th, (op, arg) in seq:
        if op == "load":
            reg[th] = counter
        elif op == "add":
            reg[th] += arg
        else:
            counter = reg[th]
    return counter


def real_fork_run(plan):
    """Really execute a fork()/print plan with os.fork() and count the lines.
    plan: list of "fork" or a string to print. Each print is flushed at once
    (as on a terminal), so buffered text is never duplicated by fork()."""
    import os
    r, w = os.pipe()
    root = os.getpid()
    children = []
    for step in plan:
        if step == "fork":
            pid = os.fork()
            if pid > 0:
                children.append(pid)
            else:
                children = []
        else:
            os.write(w, (step + "\n").encode())
    for c in children:
        os.waitpid(c, 0)
    if os.getpid() != root:
        os._exit(0)
    os.close(w)
    data = b""
    while True:
        chunk = os.read(r, 4096)
        if not chunk:
            break
        data += chunk
    os.close(r)
    words = data.decode().split()
    return {k: words.count(k) for k in sorted(set(words))}
