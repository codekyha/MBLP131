#define N_BITS    12                  /* page size 2^12 = 4096 */
#define PAGE_SIZE (1UL << N_BITS)
#define OFF_MASK  (PAGE_SIZE - 1)     /* 0xFFF                 */

/* page -> frame; -1 = invalid page */
int page_table[16] = { 5, 9, 1, 7, 12, -1, /* ... */ };

for (int i = 1; i < argc; i++) {
    unsigned long a = strtoul(argv[i], NULL, 0);
    unsigned long p = a >> N_BITS;      /* high bits  */
    unsigned long d = a & OFF_MASK;     /* low 12 bits */
    if (p >= 16 || page_table[p] < 0) continue;  /* trap */
    unsigned long f = page_table[p];
    unsigned long phys = (f << N_BITS) | d;   /* f*4096 + d */
    printf(... a, p, d, f, phys);
}
/* full program: code/page_split.c */
