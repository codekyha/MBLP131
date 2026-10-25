#!/bin/bash
# backup.sh -- timestamped .tar.gz backup of ~/lab/docs into ~/lab/backup
# Usage: ./backup.sh            (works from any folder)
lab="$HOME/lab"
src="docs"                                  # folder to save (inside $lab)
dest="$lab/backup"
stamp=$(date +%Y%m%d_%H%M%S)                # e.g. 20261012_143005
archive="$dest/docs_$stamp.tar.gz"

if [ ! -d "$lab/$src" ]; then
    echo "Error: $lab/$src not found" >&2
    exit 1
fi
mkdir -p "$dest"                            # no error if it exists
if tar -czf "$archive" -C "$lab" "$src"; then
    n=$(tar -tzf "$archive" | grep -vc '/$')    # count files, not folders
    echo "Backup created: $archive"
    echo "Files: $n, size: $(du -h "$archive" | cut -f1)"
else
    echo "Error: tar failed" >&2
    exit 1
fi
