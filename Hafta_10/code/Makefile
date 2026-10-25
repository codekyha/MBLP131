# Week 10 example:  make   then run it inside ~/lab (see demo_fileops.sh)
# The shell demos need no compiling:  bash demo_cp_mv.sh  etc. (see each file's header)
CC = gcc
CFLAGS = -Wall -O2
PROGS = fileops

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGS)
