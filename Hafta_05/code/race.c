/* race.c -- iki iş parçacığı TEK bir ortak sayacı KİLİTSİZ artırır.
 * Her iş parçacığı sayaca 10 milyon kez 1 ekler; doğru son değer
 * 20.000.000 olmalıdır. Birkaç kez çalıştırıp sonuçları karşılaştırın.
 * Derleme:   gcc -Wall -O2 -pthread race.c -o race
 * Çalıştır:  ./race
 */
#include <stdio.h>
#include <pthread.h>
#include <time.h>

#define N 10000000L              /* iş parçacığı başına artırma */

/* volatile: her artırmada gerçek bir okuma ve yazma yaptırır
 * (yoksa -O2 N'yi tek adımda ekler ve yarışı gizlerdi). */
volatile long counter = 0;       /* iki iş parçacığının ortak verisi */

void *worker(void *arg)
{
    for (long i = 0; i < N; i++)
        counter++;               /* oku, 1 ekle, yaz: atomik DEĞİL */
    return NULL;
}

static double seconds(void)
{
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec / 1e9;
}

int main(void)
{
    pthread_t a, b;
    double t0 = seconds();
    pthread_create(&a, NULL, worker, NULL);   /* A'yı başlat */
    pthread_create(&b, NULL, worker, NULL);   /* B'yi başlat */
    pthread_join(a, NULL);                    /* ikisini bekle */
    pthread_join(b, NULL);
    double t1 = seconds();

    printf("counter = %8ld of %ld  (lost %7ld)  %.3f s\n",
           counter, 2 * N, 2 * N - counter, t1 - t0);
    return 0;
}
