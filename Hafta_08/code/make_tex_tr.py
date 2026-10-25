#!/usr/bin/env python3
"""make_tex_tr.py -- Turkish copies of the generated tables (MBLP131, Hafta 8).

gen_tables.py writes the Gantt charts and tables to tex/*.tex with English headers.
This script copies every tex/*.tex to tex_tr/*.tex and translates only the header
words (terminology of the Turkish Hafta 5-7 notes). Numbers are not touched.
Run after gen_tables.py:   python3 gen_tables.py && python3 make_tex_tr.py
"""
import glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, "tex"), os.path.join(HERE, "tex_tr")

# (English, Turkish) -- order matters only for overlapping strings
WORDS = [
    (r"\textbf{Process}", r"\textbf{Süreç}"),
    (r"\textbf{Arrival}", r"\textbf{Varış}"),
    (r"\textbf{Burst}", r"\textbf{Patlama}"),
    (r"\textbf{Priority}", r"\textbf{Öncelik}"),
    (r"\textbf{Finish}", r"\textbf{Bitiş}"),
    (r"\textbf{Turnaround}", r"\textbf{Dönüş}"),
    (r"\textbf{Waiting}", r"\textbf{Bekleme}"),
    (r"\textbf{Response}", r"\textbf{Yanıt}"),
    (r"\textbf{Average}", r"\textbf{Ortalama}"),
    (r"\textbf{Request}", r"\textbf{İstek}"),
    (r"\textbf{First-fit}", r"\textbf{İlk uyan}"),
    (r"\textbf{Best-fit}", r"\textbf{En iyi uyan}"),
    (r"\textbf{Worst-fit}", r"\textbf{En kötü uyan}"),
    ("{must wait}", "{beklemek zorunda}"),
    (" leaves ", " kalan "),
    ("{reference}", "{başvuru}"),
    ("{frame 0}", "{çerçeve 0}"),
    ("{frame 1}", "{çerçeve 1}"),
    ("{frame 2}", "{çerçeve 2}"),
    ("{frame 3}", "{çerçeve 3}"),
    ("{fault?}", "{hata?}"),
]

os.makedirs(DST, exist_ok=True)
n = 0
for f in sorted(glob.glob(os.path.join(SRC, "*.tex"))):
    t = open(f, encoding="utf8").read()
    for en, tr in WORDS:
        t = t.replace(en, tr)
    open(os.path.join(DST, os.path.basename(f)), "w", encoding="utf8").write(t)
    n += 1
print(f"wrote {n} files to tex_tr/")
