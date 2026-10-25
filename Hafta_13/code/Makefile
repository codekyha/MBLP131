# Hafta 13 örnekleri:  make    sonra   ./zombie 20 &   ve   ./catch &
CC = gcc
CFLAGS = -Wall -O2
PROGS = zombie catch

all: $(PROGS)

%: %.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f $(PROGS)
