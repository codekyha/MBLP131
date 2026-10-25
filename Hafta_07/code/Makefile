# Hafta 7 örnekleri:  make    ardından   ./page_faults  ./cow_fork  ./file_access
CC = gcc
CFLAGS = -Wall -O2
PROGS = page_faults cow_fork file_access

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

run: all
	./page_faults
	./cow_fork
	./file_access
	python3 page_replacement.py

clean:
	rm -f $(PROGS) students.dat
