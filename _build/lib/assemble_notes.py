#!/usr/bin/env python3
"""assemble_notes.py LANG WEEK BODY.tex OUT.tex 'Subtitle for header comment'
Builds a self-contained XeLaTeX file: header comment + documentclass + \\weeknum + preamble + body."""
import sys, os
lang, week, body, out = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
sub = sys.argv[5] if len(sys.argv) > 5 else ""
here = os.path.dirname(os.path.abspath(__file__))
pre = open(os.path.join(here, "notes_preamble.tex" if lang == "en" else "notes_preamble_tr.tex"), encoding="utf8").read()
if lang == "en":
    head = f"""% =====================================================================
%  MCMP117 -- Fundamentals of Operating Systems
%  Week {week} Course Notes: {sub}
%  Compile with XeLaTeX (twice):  xelatex MCMP117_Week{week}_Notes.tex
%  Needs ./figures/ and the ../code/ folder.
% =====================================================================
"""
else:
    head = f"""% =====================================================================
%  MBLP131 -- İşletim Sistemleri Temelleri
%  Hafta {week} Ders Notları: {sub}
%  XeLaTeX ile iki kez derleyin:  xelatex MBLP131_Hafta{week}_Notlar.tex
%  ./figures/ ve ../code/ klasörlerine ihtiyaç duyar.
% =====================================================================
"""
doc = head + "\\documentclass[11pt,a4paper]{article}\n" + f"\\newcommand{{\\weeknum}}{{{week}}}\n" + pre.rstrip() + "\n\n\\begin{document}\n" + open(body, encoding="utf8").read().rstrip() + "\n\n\\end{document}\n"
open(out, "w", encoding="utf8").write(doc)
print("wrote", out)
