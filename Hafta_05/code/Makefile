# 5. hafta uygulama programları. Hepsini derlemek için "make", temizlemek için "make clean".
CC     = gcc
CFLAGS = -Wall -O2 -pthread

all: race race_fixed prodcons cpu_hog

race: race.c
	$(CC) $(CFLAGS) race.c -o race

race_fixed: race_fixed.c
	$(CC) $(CFLAGS) race_fixed.c -o race_fixed

prodcons: prodcons.c
	$(CC) $(CFLAGS) prodcons.c -o prodcons

cpu_hog: cpu_hog.c
	$(CC) -Wall -O2 cpu_hog.c -o cpu_hog

# slaytlardaki zamanlama sayıları
sched:
	python3 sched_check.py

clean:
	rm -f race race_fixed prodcons cpu_hog
