#!/bin/bash
# links_demo.sh -- düğümler (inode), sabit bağlantılar ve sembolik bağlantılar.
# BOŞ bir klasörde çalıştırın:   mkdir hafta7 && cd hafta7 && bash ../links_demo.sh
# (ya da komutları tek tek yazın -- bu daha iyi bir alıştırmadır).
run() { echo "\$ $*"; eval "$@" 2>&1; }   # her komutu önce yazdır, sonra çalıştır

run 'echo "hello" > notes.txt'   # yeni dosya = yeni düğüm
run 'ls -li notes.txt'           # 1. sütun: düğüm numarası; 3.: bağlantı sayısı
run 'ln notes.txt hard.txt'      # sabit bağlantı: aynı düğüme 2. bir AD
run 'ln -s notes.txt soft.txt'   # sembolik bağlantı: bir YOL saklayan yeni dosya
run 'ls -li'
run 'stat notes.txt'             # düğümde tutulan tüm öznitelikler
run 'rm notes.txt'               # bir adı siler (bağlantı sayısı 2 -> 1)
run 'cat hard.txt'               # veriye hâlâ erişilebilir
run 'cat soft.txt'               # sarkan bağlantı: saklanan yol artık yok
run 'ls -li'
