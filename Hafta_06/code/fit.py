#!/usr/bin/env python3
"""fit.py -- first-fit, best-fit and worst-fit on one shared example.

Memory (sizes in KB) is described by its list of free holes, in address
order: (start address, size). Requests arrive in order A, B, C, D.
Each algorithm takes a hole, carves the request off its *start*, and
leaves the remainder as a smaller hole at the same place.

Run:  python3 fit.py
"""

HOLES = [(300, 150), (600, 450), (1200, 200), (1600, 350), (2100, 550)]
REQUESTS = [("A", 220), ("B", 400), ("C", 130), ("D", 430)]


def choose(holes, size, rule):
    """Index of the hole chosen by the rule, or None if none is big enough."""
    fits = [i for i, (_, h) in enumerate(holes) if h >= size]
    if not fits:
        return None
    if rule == "first":
        return fits[0]                                  # lowest address
    if rule == "best":
        return min(fits, key=lambda i: holes[i][1])     # smallest that fits
    return max(fits, key=lambda i: holes[i][1])         # worst: largest


def run(rule):
    holes = list(HOLES)
    print(f"--- {rule}-fit ---")
    for name, size in REQUESTS:
        i = choose(holes, size, rule)
        if i is None:
            free = sum(h for _, h in holes)
            print(f"  {name} ({size} KB): no hole large enough -> waits "
                  f"(free {free} KB, largest hole {max(h for _, h in holes)} KB)")
            continue
        start, h = holes[i]
        print(f"  {name} ({size} KB) -> hole {h}@{start}, placed at "
              f"{start}-{start + size}, leftover {h - size} KB")
        holes[i] = (start + size, h - size)
    holes = [(s, h) for s, h in holes if h > 0]
    print("  holes left:", ", ".join(f"{h}@{s}" for s, h in holes),
          f"| total free = {sum(h for _, h in holes)} KB")


if __name__ == "__main__":
    print("holes (size@start):", ", ".join(f"{h}@{s}" for s, h in HOLES),
          "| total =", sum(h for _, h in HOLES), "KB")
    print("requests:", ", ".join(f"{n}={s}" for n, s in REQUESTS), "\n")
    for rule in ("first", "best", "worst"):
        run(rule)
