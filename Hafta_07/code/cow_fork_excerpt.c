char *buf = malloc(SIZE);              /* 32 MB = 8192 sayfa */
memset(buf, 'A', SIZE);                /* sayfalar ebeveynin */

pid_t pid = fork();
if (pid == 0) {                        /* ---- çocuk ----    */
    long f0 = minor_faults();
    for (long i = 0; i < SIZE; i += page)
        sum += buf[i];                 /* OKU: paylaşılan    */
    long f1 = minor_faults();
    for (long i = 0; i < SIZE; i += page)
        buf[i] = 'B';                  /* YAZ: sayfa kopyası */
    long f2 = minor_faults();
    /* f1 - f0 ve f2 - f1 yazdırılır */
    exit(0);
}
wait(NULL);
printf("parent still sees '%c'\n", buf[0]);
/* programın tamamı: code/cow_fork.c */
