/* array_sum.c -- büyük bir diziyi T iş parçacığıyla toplar.
 * Dizi T eşit dilime bölünür; k. iş parçacığı k. dilimi kendi
 * partial[k] gözüne toplar; main() T kısmi toplamı birleştirir.
 * Derleme:   gcc -Wall -O2 -pthread array_sum.c -o array_sum
 * Çalıştır:  ./array_sum 1     ./array_sum 2     ./array_sum 4
 */
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>

#define N       100000000L  /* 100 milyon sayı (400 MB int) */
#define MAXT    64
#define REPEAT  20          /* 20 kez topla: daha uzun, daha kararlı ölçüm */

int  *a;                    /* ortak dizi: TÜM iş parçacıkları okur */
long  partial[MAXT];        /* her iş parçacığına bir sonuç gözü    */
int   T;                    /* iş parçacığı sayısı                  */

void *sum_slice(void *arg)
{
    long k     = (long)arg;            /* ben hangi dilimim? */
    long start = k * N / T;
    long end   = (k + 1) * N / T;
    long s = 0;
    for (int r = 0; r < REPEAT; r++)
        for (long i = start; i < end; i++)
            s += a[i];
    partial[k] = s;                    /* yalnızca KENDİ gözüme yaz */
    return NULL;
}

static double now(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec / 1e9;
}

int main(int argc, char *argv[])
{
    T = (argc > 1) ? atoi(argv[1]) : 1;
    if (T < 1 || T > MAXT) { fprintf(stderr, "1 <= T <= %d\n", MAXT); return 1; }

    a = malloc(N * sizeof(int));
    if (a == NULL) { perror("malloc"); return 1; }
    for (long i = 0; i < N; i++)
        a[i] = i % 10;                 /* 0,1,...,9,0,1,... */

    pthread_t th[MAXT];
    double t0 = now();
    for (long k = 0; k < T; k++)
        pthread_create(&th[k], NULL, sum_slice, (void *)k);
    long total = 0;
    for (long k = 0; k < T; k++) {
        pthread_join(th[k], NULL);
        total += partial[k];
    }
    double t1 = now();

    printf("threads = %d   sum = %ld   time = %.3f s\n", T, total, t1 - t0);
    free(a);
    return 0;
}
