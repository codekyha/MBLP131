#!/usr/bin/env python3
"""page_replacement.py -- FIFO, OPT ve LRU sayfa değiştirme benzetimi.
Her başvurudan sonra çerçevelerin içeriğini (F = sayfa hatası) ve sayfa
hatası sayısını yazdırır. Belady anomalisini ve EAT örneğini de denetler.
Çalıştır:  python3 page_replacement.py
"""

def simulate(refs, nframes, policy):
    frames, faults, rows = [], 0, []
    queue = []            # FIFO: geliş sırası
    last_use = {}         # LRU: son kullanım zamanı
    for t, p in enumerate(refs):
        fault = p not in frames
        if fault:
            faults += 1
            if len(frames) < nframes:           # boş çerçeve var
                frames.append(p)
            else:                                # kurban seç
                if policy == "FIFO":
                    victim = queue.pop(0)
                elif policy == "LRU":
                    victim = min(frames, key=lambda q: last_use[q])
                elif policy == "OPT":            # gelecekte en geç kullanılacak
                    def next_use(q):
                        rest = refs[t + 1:]
                        return rest.index(q) if q in rest else float("inf")
                    victim = max(frames, key=next_use)
                frames[frames.index(victim)] = p   # aynı yuva
            if policy == "FIFO":
                queue.append(p)
        last_use[p] = t
        rows.append((p, list(frames), fault))
    return faults, rows

def show(refs, n, policy, tag=""):
    faults, rows = simulate(refs, n, policy)
    print(f"{tag}{policy}, {n} frames: {faults} page faults")
    print("ref   " + " ".join(f"{p:>2}" for p, _, _ in rows))
    for k in range(n):
        line = []
        for _, fr, _ in rows:
            line.append(f"{fr[k]:>2}" if k < len(fr) else " .")
        print(f"fr{k}   " + " ".join(line))
    print("fault " + " ".join(" F" if f else "  " for _, _, f in rows))
    print()
    return faults

refs = [7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1]
for pol in ("FIFO", "OPT", "LRU"):
    show(refs, 3, pol)

belady = [1,2,3,4,1,2,5,1,2,3,4,5]
for n in (3, 4):
    show(belady, n, "FIFO", tag="Belady: ")
for n in (3, 4):                    # LRU bir yığın algoritmasıdır: anomali yok
    print(f"Belady string, LRU {n} frames: {simulate(belady, n, 'LRU')[0]} faults")
print()

# Sayfa hatalarıyla etkin erişim süresi
tm, tf = 200e-9, 8e-3
for p in (0.001,):
    eat = (1 - p) * tm + p * tf
    print(f"EAT(p={p}) = {eat*1e9:.1f} ns = {eat*1e6:.3f} us, slowdown x{eat/tm:.1f}")
pmax = (0.1 * tm) / (tf - tm)       # (1-p)tm + p tf < 1.1 tm
print(f"slowdown < 10%  =>  p < {pmax:.3e}  (1 fault per {1/pmax:,.0f} accesses)")
print()

# DELTA pencereli çalışma kümesi (t anına kadarki son DELTA başvuru)
ws_refs = [2,6,1,5,7,7,7,7,5,1,6,2,3,4,1,2,3,4,4,4,3,4,3,4,4,4]
DELTA = 10
for t in (9, 25):                   # 0'dan başlayan konumlar: t1 ve t2
    window = ws_refs[t - DELTA + 1:t + 1]
    print(f"WS(t={t+1}) window {window} -> {sorted(set(window))}, WSS={len(set(window))}")
