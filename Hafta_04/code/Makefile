# Hafta 4 programları.  Hepsini derlemek için "make" yazın.
CC     = gcc
CFLAGS = -Wall -O2 -pthread
PROGS  = thread_hello array_sum burst create_cost

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGS) burst.tmp
