static long minor_faults(void)          /* çekirdeğin sayacı */
{
    struct rusage ru;
    getrusage(RUSAGE_SELF, &ru);
    return ru.ru_minflt;
}

int main(void)
{
    long page = sysconf(_SC_PAGESIZE);  /* 4096 bayt    */
    long size = 64 * MB;                /* 16384 sayfa  */

    long f0 = minor_faults();
    char *a = malloc(size);             /* yalnızca sanal */
    long f1 = minor_faults();
    for (long i = 0; i < size; i += page)
        a[i] = 1;                       /* ilk dokunuş  */
    long f2 = minor_faults();
    for (long i = 0; i < size; i += page)
        a[i] += 1;                      /* artık bellekte */
    long f3 = minor_faults();
    /* f1-f0, f2-f1, f3-f2 yazdırılır */
}
/* programın tamamı: code/page_faults.c */
