#!/bin/bash
# build_notes.sh file.tex  -> runs xelatex twice in the file's dir, prints errors/overfull summary
cd "$(dirname "$1")"; f=$(basename "$1")
xelatex -interaction=nonstopmode -halt-on-error "$f" >/dev/null 2>&1
xelatex -interaction=nonstopmode -halt-on-error "$f" >/dev/null 2>&1
log="${f%.tex}.log"
grep -n "^!" "$log" | head -20
echo "Overfull hbox (>5pt): $(grep -E 'Overfull \\hbox \(([5-9]|[1-9][0-9]+)\.' "$log" | wc -l)"
grep -A1 -E 'Overfull \\hbox \(([5-9]|[1-9][0-9]+)\.' "$log" | head -12
grep -c "LaTeX Warning: Reference" "$log" | sed 's/^/undefined refs: /'
ls -la "${f%.tex}.pdf" 2>/dev/null | awk '{print $5, $9}'; pdfinfo "${f%.tex}.pdf" 2>/dev/null | grep Pages
rm -f missfont.log mfput.log
