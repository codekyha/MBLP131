#define N 1000000L

long plain_function(long x) { return x + 1; }

int main(void)
{
    volatile long sink = 0;
    double t0 = seconds();
    for (long i = 0; i < N; i++)
        sink += plain_function(i);   /* kullanıcı modu */
    double t1 = seconds();
    for (long i = 0; i < N; i++)
        sink += syscall(SYS_getpid); /* çekirdeğe gidiş */
    double t2 = seconds();

    printf("ordinary function call : %6.1f ns\n",
           (t1 - t0) / N * 1e9);
    printf("system call (getpid)   : %6.1f ns\n",
           (t2 - t1) / N * 1e9);
}
/* programın tamamı: code/syscall_cost.c */
