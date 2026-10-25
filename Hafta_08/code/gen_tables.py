#!/usr/bin/env python3
"""gen_tables.py -- writes the LaTeX fragments (Gantt charts, schedule tables,
frame tables, fit tables) used by the Week 8 notes and the sample exam key.

All fragments are computed with the simulators in osim.py, so the tables in
the PDFs are exactly the numbers printed by review_problems.py,
practice_exam.py and sample_exam.py.

Run:   python3 gen_tables.py        (writes tex/*.tex)
"""
import os
from osim import schedule, metrics, replace, fit_run, fmt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "tex")
os.makedirs(OUT, exist_ok=True)


def write(name, text):
    with open(os.path.join(OUT, name), "w") as fh:
        fh.write(text.rstrip() + "\n")
    print("wrote tex/" + name)


# ----------------------------------------------------------------- scheduling
def gantt_tex(segs, unit):
    return "\\gantt{%s}{%s}" % (unit, ", ".join(f"{p}/{a}/{b}" for p, a, b in segs))


def sched_tex(jobs, segs, prio=False):
    res, avg = metrics(jobs, segs)
    cols = "@{}l" + "c" * (7 if prio else 6) + "@{}"
    head = ["Process", "Arrival", "Burst"] + (["Priority"] if prio else []) + \
           ["Finish", "Turnaround", "Waiting", "Response"]
    lines = ["\\begin{tabular}{%s}" % cols, "\\toprule",
             " & ".join(f"\\textbf{{{h}}}" for h in head) + "\\\\", "\\midrule"]
    for name, arr, burst, pr in jobs:
        r = res[name]
        row = [name, str(arr), str(burst)] + ([str(pr)] if prio else []) + \
              [str(r["completion"]), f"${r['completion']}-{arr}={r['turnaround']}$",
               f"${r['turnaround']}-{burst}={r['waiting']}$", str(r["response"])]
        lines.append(" & ".join(row) + "\\\\")
    n = len(jobs)
    sums = {k: sum(r[k] for r in res.values()) for k in ("turnaround", "waiting", "response")}
    pad = " & " * (4 if prio else 3)
    lines += ["\\midrule",
              "\\textbf{Average}" + pad +
              f" & ${sums['turnaround']}/{n}={fmt(avg['turnaround'])}$"
              f" & ${sums['waiting']}/{n}={fmt(avg['waiting'])}$"
              f" & ${sums['response']}/{n}={fmt(avg['response'])}$\\\\",
              "\\bottomrule", "\\end{tabular}"]
    return "\n".join(lines)


def sched_set(prefix, jobs, algos, unit, prio=False):
    for key, q, tag in algos:
        segs = schedule(jobs, key, q)
        write(f"{prefix}_gantt_{tag}.tex", gantt_tex(segs, unit))
        write(f"{prefix}_sched_{tag}.tex", sched_tex(jobs, segs, prio))


# ----------------------------------------------------------- page replacement
def frames_tex(refs, n, policy, cw=0.66):
    """Week 7 style: mint = page just loaded, pale = fault column, light = hit."""
    faults, rows = replace(refs, n, policy)
    out = ["\\begin{tikzpicture}[c/.style={rectangle,minimum width=%.2fcm,"
           "minimum height=0.46cm,inner sep=0pt,font=\\small}]" % (cw - 0.05)]
    labels = ["reference"] + [f"frame {k}" for k in range(n)] + ["fault?"]
    for r, lab in enumerate(labels):
        out.append("\\node[anchor=east,font=\\footnotesize\\itshape,text=muted] at (-0.1,%.2f) {%s};"
                   % (-0.52 * r, lab))
    prev = []
    for t, (p, fr, fault, victim) in enumerate(rows):
        x = 0.33 + cw * t
        out.append("\\node[c,fill=charcoal,text=white,font=\\small\\bfseries] at (%.2f,0) {%d};" % (x, p))
        for k in range(n):
            v = fr[k] if k < len(fr) else None
            new = fault and v == p and (k >= len(prev) or prev[k] != v)
            if new:
                style, txt = "fill=mint,text=black", "\\bfseries%d" % v
            elif fault:
                style, txt = "fill=mint!25,text=black", ("" if v is None else str(v))
            else:
                style, txt = "fill=light,text=muted!70", ("" if v is None else str(v))
            out.append("\\node[c,%s] at (%.2f,%.2f) {%s};" % (style, x, -0.52 * (k + 1), txt))
        if fault:
            out.append("\\node[c,text=red!60!black,font=\\small\\bfseries] at (%.2f,%.2f) {F};"
                       % (x, -0.52 * (n + 1)))
        prev = list(fr)
    out.append("\\end{tikzpicture}")
    return "\n".join(out), faults


def frames_set(prefix, refs, n=3):
    for pol in ("FIFO", "LRU", "OPT"):
        tex, f = frames_tex(refs, n, pol)
        write(f"{prefix}_frames_{pol}.tex", tex)
        print(f"   {prefix} {pol}: {f} faults")


# ------------------------------------------------------------------- fits
def fits_tex(holes, req):
    quiet = lambda s: None
    res = {r: fit_run(holes, req, r, quiet)[0] for r in ("first", "best", "worst")}
    lines = ["\\begin{tabular}{@{}lccc@{}}", "\\toprule",
             "\\textbf{Request} & \\textbf{First-fit} & \\textbf{Best-fit} & \\textbf{Worst-fit}\\\\",
             "\\midrule"]
    for name, size in req:
        cells = []
        for r in ("first", "best", "worst"):
            p = res[r][name]
            cells.append(f"${p[0]}@{p[1]}$ $\\to$ leaves ${p[2]}$" if p else
                         "\\textcolor{red!60!black}{must wait}")
        lines.append(f"{name} $= {size}$ & " + " & ".join(cells) + "\\\\")
    lines += ["\\bottomrule", "\\end{tabular}"]
    return "\n".join(lines)


if __name__ == "__main__":
    # ---- review problems (slides + Study Guide), same data as review_problems.py
    RJ = [("P1", 0, 7, 2), ("P2", 2, 4, 1), ("P3", 3, 2, 4), ("P4", 5, 5, 3)]
    sched_set("rv", RJ, [("FCFS", None, "fcfs"), ("SJF", None, "sjf"), ("SRTF", None, "srtf"),
                         ("PRIO_P", None, "prio"), ("RR", 3, "rr3")], 0.85, prio=True)
    frames_set("rv", [1, 2, 0, 4, 2, 3, 2, 1, 2, 4, 0, 2, 0, 1])
    write("rv_fits.tex", fits_tex([(100, 300), (500, 600), (1300, 200), (1700, 450), (2400, 350)],
                                  [("A", 340), ("B", 180), ("C", 420), ("D", 500)]))
    # ---- practice exam (notes), same data as practice_exam.py
    PJ = [("P1", 0, 8, 0), ("P2", 1, 4, 0), ("P3", 2, 2, 0), ("P4", 4, 5, 0)]
    sched_set("pr", PJ, [("FCFS", None, "fcfs"), ("SRTF", None, "srtf"), ("RR", 4, "rr4")], 0.8)
    frames_set("pr", [4, 1, 2, 4, 3, 5, 1, 3, 2, 4, 3, 5])
    write("pr_fits.tex", fits_tex([(200, 250), (600, 500), (1300, 150), (1600, 400), (2200, 300)],
                                  [("A", 210), ("B", 380), ("C", 290), ("D", 450)]))
    # ---- sample paper (answer key), same data as sample_exam.py
    SJ = [("A", 0, 6, 3), ("B", 2, 5, 2), ("C", 3, 2, 1), ("D", 5, 4, 4)]
    sched_set("sa", SJ, [("SJF", None, "sjf"), ("PRIO_P", None, "prio"), ("RR", 3, "rr3")], 0.85, prio=True)
    frames_set("sa", [1, 0, 4, 2, 1, 0, 1, 2, 3, 1, 2, 3])
    write("sa_fits.tex", fits_tex([(200, 650), (1100, 450), (1800, 200), (2200, 550), (3000, 250)],
                                  [("A", 270), ("B", 290), ("C", 330), ("D", 510)]))
