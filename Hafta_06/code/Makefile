# Week 6 hands-on programs.  Build all:  make     Clean:  make clean
CC     = gcc
CFLAGS = -Wall -O2
PROGS  = mem_layout fork_vaddr page_split

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGS)
