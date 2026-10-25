#!/usr/bin/env python3
"""sched_check.py -- a tiny CPU-scheduling simulator for Week 5.

Every number on the Week 5 slides and in the notes comes from this file.
Run:   python3 sched_check.py            (prints Gantt charts and tables)
       python3 sched_check.py --review   (also the review-question answers)
       python3 sched_check.py --json     (also writes sched_results.json,
                                          which build_deck.js reads)

Conventions (state them in class!):
  * Time is in milliseconds (ms); one simulation step = 1 ms.
  * Context-switch time is taken as 0.
  * Ties are broken by arrival time, then by process name (P1 before P2).
  * Priority: a SMALLER number means a HIGHER priority (Linux/Silberschatz style).
  * Round Robin: a process that arrives at the same instant as a quantum
    expires is put into the ready queue BEFORE the preempted process.
"""
import json, sys, os

# ---- the one common job set used for all algorithms ---------------------------
JOBS = [  # name, arrival, burst, priority
    ("P1", 0, 7, 3),
    ("P2", 2, 4, 1),
    ("P3", 4, 1, 4),
    ("P4", 5, 4, 2),
]


def metrics(jobs, segs):
    """segs: list of (name, start, end). Returns per-process dict + averages."""
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
    avg = {k: sum(r[k] for r in res.values()) / n for k in ("waiting", "turnaround", "response")}
    return res, avg


def merge(segs):
    """Join adjacent 1-ms pieces of the same process into one Gantt box."""
    out = []
    for s in segs:
        if out and out[-1][0] == s[0] and out[-1][2] == s[1]:
            out[-1] = (s[0], out[-1][1], s[2])
        else:
            out.append(s)
    return out


def nonpreemptive(jobs, key):
    """Generic non-preemptive scheduler: when the CPU is free, pick min(key)."""
    t, segs, left = 0, [], list(jobs)
    while left:
        ready = [j for j in left if j[1] <= t]
        if not ready:                       # CPU idle until next arrival
            nxt = min(j[1] for j in left)
            segs.append(("idle", t, nxt)); t = nxt; continue
        j = min(ready, key=key)
        segs.append((j[0], t, t + j[2])); t += j[2]; left.remove(j)
    return [s for s in segs if s[0] != "idle"]


def preemptive(jobs, key):
    """Generic preemptive scheduler, simulated 1 ms at a time: always run min(key)."""
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
        admit(t)                      # newcomers enter BEFORE the preempted process
        if rem[p] > 0:
            queue.append(p)
    return merge(segs)


def fcfs(jobs):
    return nonpreemptive(jobs, key=lambda j: (j[1], j[0]))


def sjf(jobs):
    return nonpreemptive(jobs, key=lambda j: (j[2], j[1], j[0]))


def srtf(jobs):
    return preemptive(jobs, key=lambda j, rem: (rem[j[0]], j[1], j[0]))


def prio_np(jobs):
    return nonpreemptive(jobs, key=lambda j: (j[3], j[1], j[0]))


def prio_p(jobs):
    return preemptive(jobs, key=lambda j, rem: (j[3], j[1], j[0]))


def switches(segs):
    """Number of context switches = changes of the running process."""
    return len(segs) - 1


def show(title, jobs, segs):
    res, avg = metrics(jobs, segs)
    print(f"\n=== {title} ===")
    print("Gantt: " + " ".join(f"[{s[1]}-{s[2]} {s[0]}]" for s in segs))
    print(f"{'':4}{'arr':>5}{'burst':>6}{'prio':>5}{'first':>6}{'done':>6}{'TAT':>5}{'wait':>5}{'resp':>5}")
    for n, r in res.items():
        print(f"{n:4}{r['arrival']:5}{r['burst']:6}{r['priority']:5}{r['first']:6}{r['completion']:6}"
              f"{r['turnaround']:5}{r['waiting']:5}{r['response']:5}")
    print(f"avg waiting {avg['waiting']:.2f}  avg turnaround {avg['turnaround']:.2f}  "
          f"avg response {avg['response']:.2f}  context switches {switches(segs)}")
    return dict(segs=segs, per=res, avg=avg, switches=switches(segs))


def exp_average(alpha, tau0, bursts):
    taus = [tau0]
    for t in bursts:
        taus.append(alpha * t + (1 - alpha) * taus[-1])
    return taus


if __name__ == "__main__":
    out = {"jobs": JOBS}

    # 1) Convoy effect: three jobs arriving at t = 0 in two different orders
    for label, order in (("convoy_long_first", [("P1", 0, 24, 0), ("P2", 0, 3, 0), ("P3", 0, 3, 0)]),
                         ("convoy_short_first", [("P2", 0, 3, 0), ("P3", 0, 3, 0), ("P1", 0, 24, 0)])):
        # all arrive at 0; serve in list order
        t, segs = 0, []
        for j in order:
            segs.append((j[0], t, t + j[2])); t += j[2]
        out[label] = show("FCFS " + label, order, segs)

    # 2) The common job set under every algorithm
    algos = [("FCFS", fcfs(JOBS)), ("SJF", sjf(JOBS)), ("SRTF", srtf(JOBS)),
             ("PRIO_NP", prio_np(JOBS)), ("PRIO_P", prio_p(JOBS)),
             ("RR4", round_robin(JOBS, 4)), ("RR2", round_robin(JOBS, 2)),
             ("RR1", round_robin(JOBS, 1)), ("RR8", round_robin(JOBS, 8))]
    for name, segs in algos:
        out[name] = show(name, JOBS, segs)

    # 3) Exponential averaging of burst lengths (alpha = 1/2, tau0 = 10 ms)
    bursts = [6, 4, 6, 4, 13, 13, 13]
    taus = exp_average(0.5, 10, bursts)
    print("\n=== exponential averaging, alpha = 0.5, tau0 = 10 ===")
    print("actual t_n :", bursts)
    print("predicted  :", taus)
    out["expavg"] = dict(alpha=0.5, tau0=10, bursts=bursts, taus=taus)

    # 4) Extra numbers used on the slides
    s_cs = 0.1  # illustrative context-switch cost in ms
    over = {q: s_cs / (q + s_cs) for q in (1, 4, 10, 100)}
    print("\n=== RR overhead s/(q+s) with s = 0.1 ms ===")
    for q, f in over.items():
        print(f"q = {q:3} ms : {100 * f:.1f} % of CPU time spent switching")
    aging_s = 127 * 1          # priority 127 -> 0, raised by 1 every second
    print(f"\naging 127 -> 0 at 1 step/s: {aging_s} s = {aging_s // 60} min {aging_s % 60} s")
    w0, w10 = 1024, 110        # Linux load weights for nice 0 and nice 10
    print(f"nice 0 vs nice 10 on one CPU: {100 * w0 / (w0 + w10):.1f} % / "
          f"{100 * w10 / (w0 + w10):.1f} %  (ratio {w0 / w10:.2f})")
    out["extras"] = dict(rr_overhead=over, aging_s=aging_s,
                         nice_share=[w0 / (w0 + w10), w10 / (w0 + w10)])

    # 5) Answers to the numerical review questions in the notes
    if "--review" in sys.argv:
        RJ = [("A", 0, 6, 2), ("B", 1, 3, 1), ("C", 2, 8, 3), ("D", 3, 2, 4)]
        for name, segs in (("review FCFS", fcfs(RJ)), ("review SJF", sjf(RJ)),
                           ("review SRTF", srtf(RJ)), ("review RR q=3", round_robin(RJ, 3))):
            show(name, RJ, segs)
        print("review exp. averaging alpha=0.5, tau0=12, bursts 10,6,8:", exp_average(0.5, 12, [10, 6, 8]))

    if "--json" in sys.argv:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sched_results.json")
        json.dump(out, open(path, "w"), indent=1)
        print("\nwrote", path)
