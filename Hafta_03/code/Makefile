# 3. hafta örnekleri.  Kullanım: make      (hepsini derler)   make clean
CC     = gcc
CFLAGS = -Wall -O2
PROGS  = raw_write mem_layout fork_exec_wait fork_count

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGS)
