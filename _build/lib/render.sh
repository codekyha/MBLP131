#!/bin/bash
# usage: render.sh deck.pptx outdir   -> PDF + contact sheets of 9
S=$(ls -d /root/.claude/skills/synced/*/pptx | head -1)
mkdir -p "$2"; find "$2" -maxdepth 1 -name 'p-*.jpg' -delete
python3 $S/scripts/office/soffice.py --headless --convert-to pdf --outdir "$2" "$1" >/dev/null 2>&1
pdf="$2/$(basename "${1%.pptx}").pdf"
pdftoppm -jpeg -r 55 "$pdf" "$2/p"
python3 - "$2" <<'PY'
import sys,glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+'/p-*.jpg'))
for k in range(0,len(fs),9):
    ims=[Image.open(f) for f in fs[k:k+9]];w,h=ims[0].size
    S=Image.new('RGB',(3*w,3*h),'white')
    for i,im in enumerate(ims):S.paste(im,((i%3)*w,(i//3)*h))
    S.save(f'{d}/sheet{k//9}.jpg')
print(len(fs),'pages')
PY
