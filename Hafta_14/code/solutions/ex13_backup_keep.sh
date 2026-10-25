#!/bin/bash
# ex13_backup_keep.sh -- Lab exercise 13: backup.sh that keeps only the 3 newest archives
lab="$HOME/lab"
dest="$lab/backup"
keep=3
archive="$dest/docs_$(date +%Y%m%d_%H%M%S).tar.gz"
mkdir -p "$dest"
tar -czf "$archive" -C "$lab" docs || exit 1
echo "Created $(basename "$archive")"
# names contain only letters, digits and _ , so ls is safe here; newest first
# shellcheck disable=SC2012
ls -1t "$dest"/docs_*.tar.gz | tail -n +$((keep + 1)) | while read -r old; do
    echo "Removing old backup $(basename "$old")"
    rm -- "$old"
done
