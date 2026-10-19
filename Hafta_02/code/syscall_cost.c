/* syscall_cost.c -- çekirdeğe bir yolculuk ne kadar pahalı?
 * Küçük, sıradan bir fonksiyonu N kez çağırırız; ardından küçük bir
 * sistem çağrısını (getpid) N kez yaparız ve süreleri karşılaştırırız.
 * Derleme   : gcc -O2 syscall_cost.c -o syscall_cost
 * Çalıştırma: ./syscall_cost
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <time.h>
#include <unistd.h>
#include <sys/syscall.h>

#define N 1000000L

/* noinline: derleyicinin çağrıyı optimize edip yok etmesini engeller */
__attribute__((noinline)) long plain_function(long x)
{
    return x + 1;
}

static double seconds(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec / 1e9;
}

int main(void)
{
    volatile long sink = 0;            /* sonuçları "kullanılmış" tutar */
    double t0, t1, t2;

    t0 = seconds();
    for (long i = 0; i < N; i++)
        sink += plain_function(i);     /* kullanıcı modunda kalır */
    t1 = seconds();
    for (long i = 0; i < N; i++)
        sink += syscall(SYS_getpid);   /* kullanıcı -> çekirdek -> kullanıcı */
    t2 = seconds();

    double f = (t1 - t0) / N * 1e9;    /* çağrı başına nanosaniye */
    double s = (t2 - t1) / N * 1e9;
    printf("sıradan fonksiyon çağrısı : %6.1f ns\n", f);
    printf("sistem çağrısı (getpid)   : %6.1f ns\n", s);
    printf("sistem çağrısı yaklaşık %.0f kat daha yavaş\n", s / f);
    return 0;
}
