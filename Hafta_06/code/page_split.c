/* page_split.c -- split an address into page number p and offset d.
 * With a page size of 2^n bytes, the low n bits are the offset and
 * the remaining high bits are the page number:
 *     p = addr >> n          d = addr & (2^n - 1)
 * Then translate with a tiny made-up page table (page -> frame):
 *     physical = frame * 2^n + d  =  (frame << n) | d
 * Compile:  gcc -Wall -O2 page_split.c -o page_split
 * Run:      ./page_split 0x3A7F 0x1234 0x5000
 */
#include <stdio.h>
#include <stdlib.h>

#define N_BITS    12                     /* page size 2^12 = 4096 bytes */
#define PAGE_SIZE (1UL << N_BITS)
#define OFF_MASK  (PAGE_SIZE - 1)        /* 0xFFF: low 12 bits set      */

/* page table of a 16-page (64 KB) address space; -1 = invalid page */
static const int page_table[16] = { 5, 9, 1, 7, 12, -1, -1, -1,
                                   -1, -1, -1, -1, -1, -1, -1, -1 };

int main(int argc, char *argv[])
{
    printf("page size = %lu bytes, offset mask = 0x%lX\n\n",
           PAGE_SIZE, OFF_MASK);
    for (int i = 1; i < argc; i++) {
        unsigned long a = strtoul(argv[i], NULL, 0); /* accepts 0x.. */
        unsigned long p = a >> N_BITS;               /* high bits    */
        unsigned long d = a & OFF_MASK;              /* low 12 bits  */
        printf("0x%04lX (%5lu): p = %2lu, d = 0x%03lX (%4lu)", a, a, p, d, d);
        if (p >= 16 || page_table[p] < 0) {
            printf(" -> invalid: trap to OS\n");
            continue;
        }
        unsigned long f = (unsigned long)page_table[p];
        unsigned long phys = (f << N_BITS) | d;
        printf(" -> frame %2lu -> 0x%04lX (%5lu)\n", f, phys, phys);
    }
    return 0;
}
