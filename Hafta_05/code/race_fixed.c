/* race_fixed.c -- aynı program; ama artırma işlemi, bir muteks
 * kilidiyle korunan bir KRİTİK BÖLGEdir.
 * Derleme:   gcc -Wall -O2 -pthread race_fixed.c -o race_fixed
 * Çalıştır:  ./race_fixed
 */
#include <stdio.h>
#include <pthread.h>
#include <time.h>

#define N 10000000L

long counter = 0;                                  /* ortak veri    */
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;  /* onu korur     */

void *worker(void *arg)
{
    for (long i = 0; i < N; i++) {
        pthread_mutex_lock(&lock);     /* al: giriş bölümü       */
        counter++;                     /* kritik bölge           */
        pthread_mutex_unlock(&lock);   /* bırak: çıkış bölümü    */
    }
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
    pthread_create(&a, NULL, worker, NULL);
    pthread_create(&b, NULL, worker, NULL);
    pthread_join(a, NULL);
    pthread_join(b, NULL);
    double t1 = seconds();

    printf("counter = %8ld of %ld  (lost %7ld)  %.3f s\n",
           counter, 2 * N, 2 * N - counter, t1 - t0);
    return 0;
}
