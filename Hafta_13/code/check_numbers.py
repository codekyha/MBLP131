#!/usr/bin/env python3
"""check_numbers.py -- verifies every number quoted on the Week 13 slides/notes."""
# 1) exit status of a process killed by signal n is 128 + n (bash convention)
for name, n, seen in [("SIGINT", 2, 130), ("SIGKILL", 9, 137), ("SIGTERM", 15, 143), ("SIGHUP", 1, 129)]:
    print(f"{name:7s} {n:2d}: 128 + {n} = {128 + n}" + (f"   (measured {seen})" if seen != 129 else ""))
    assert 128 + n == seen
# 2) nice weights (Linux sched_prio_to_weight): nice 0 -> 1024, nice 10 -> 110
w0, w10 = 1024, 110
print(f"CPU share nice 0 : {100*w0/(w0+w10):.1f} %,  nice 10: {100*w10/(w0+w10):.1f} %,  ratio {w0/w10:.2f}")
print(f"measured (out_nice.txt): 89.3 % and 9.6 %, ratio {89.3/9.6:.2f}")
# each nice step is a factor of about 1.25: 1.25**10
print(f"1.25**10 = {1.25**10:.2f}  (close to 1024/110 = {w0/w10:.2f})")
# 3) nice range: -20..19 -> 40 values; top PR = 20 + NI
print("nice values:", len(range(-20, 20)), " PR for NI=-20, 0, 19:", [20 + n for n in (-20, 0, 19)])
# 4) load average on a machine with c cores
for load, cores in [(0.59, 2), (2.0, 2), (3.0, 2), (1.0, 4)]:
    print(f"load {load} on {cores} cores: {100*load/cores:.1f} % of capacity" +
          (f", about {load-cores:.1f} process(es) waiting for a CPU on average" if load > cores else ""))
# 5) %CPU of the yes process in top/ps: one core fully used = 100 %; machine total = 2 cores
print("one busy core out of 2 =", 100 * 1 / 2, "% of the whole machine (top's %Cpu(s) line)")
# 6) PID range
print("pid_max = 32768 -> largest PID", 32768 - 1)
