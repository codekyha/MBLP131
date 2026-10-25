#!/usr/bin/env bash
# =============================================================================
# Course script: Fundamentals of Operating Systems (MCMP117 English / MBLP131 Turkish).
# Unpacks the course code base (the weekly code packs, Weeks 2-15) into ~/opsys.
#
#   bash opsys_code.sh            unpack; a file that already exists is left alone (student work is never overwritten)
#   bash opsys_code.sh --reset    unpack and overwrite the course files with the originals (files you added stay)
#
# lab_install.sh runs it once as the lab user (courses/*.sh). The code base is the archive opsys-code.tar.gz that
# lies next to this script (it holds one folder, opsys/); OPSYS_ARCHIVE and OPSYS_DEST override the archive and the
# target folder. Exit status 0 = every file of the archive is in place.
# =============================================================================
set -u

usage() { awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "${BASH_SOURCE[0]}"; }

mode=keep
case "${1:-}" in
    "") ;;
    --reset) mode=reset ;;
    -h|--help) usage; exit 0 ;;
    *) echo "opsys_code: unknown option '$1' (use --reset or --help)" >&2; exit 2 ;;
esac

if [ -z "${HOME:-}" ]; then
    HOME="$(getent passwd "$(id -u)" | cut -d: -f6)"
    export HOME
fi
umask 022

self_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
archive="${OPSYS_ARCHIVE:-}"
if [ -z "$archive" ]; then
    for d in "$self_dir" /opt/lab/courses; do
        if [ -f "$d/opsys-code.tar.gz" ]; then archive="$d/opsys-code.tar.gz"; break; fi
    done
fi
if [ -z "$archive" ] || [ ! -f "$archive" ]; then
    echo "opsys_code: opsys-code.tar.gz not found (looked next to this script and in /opt/lab/courses)" >&2
    exit 1
fi
dest="${OPSYS_DEST:-$HOME/opsys}"

if ! tar -tzf "$archive" >/dev/null 2>&1; then
    echo "opsys_code: $archive is not a readable .tar.gz archive" >&2
    exit 1
fi
mkdir -p "$dest" || { echo "opsys_code: cannot create $dest" >&2; exit 1; }

if [ "$mode" = reset ]; then
    tar -xzf "$archive" -C "$dest" --strip-components=1 --no-same-owner --overwrite || { echo "opsys_code: unpacking failed" >&2; exit 1; }
else
    tar -xzf "$archive" -C "$dest" --strip-components=1 --no-same-owner --skip-old-files || { echo "opsys_code: unpacking failed" >&2; exit 1; }
fi

# Is every file of the archive there? (the archive lists "opsys/<path>"; directories end with "/")
total=0
missing=0
while IFS= read -r entry; do
    case "$entry" in */) continue ;; esac
    total=$((total + 1))
    rel="${entry#*/}"
    if [ ! -f "$dest/$rel" ]; then
        echo "opsys_code: missing after unpacking: $rel" >&2
        missing=$((missing + 1))
    fi
done < <(tar -tzf "$archive")
if [ "$total" -eq 0 ] || [ "$missing" -ne 0 ]; then
    echo "opsys_code: $missing of $total files are missing in $dest" >&2
    exit 1
fi

if [ "$mode" = reset ]; then
    echo "opsys_code: $total course files restored in $dest"
else
    echo "opsys_code: $total course files in $dest (existing files were kept)"
fi
exit 0
