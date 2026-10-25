int  *a;              /* büyük dizi: ortak      */
long  partial[MAXT];  /* her iş parçacığına bir */

void *sum_slice(void *arg)
{
    long k = (long)arg;               /* dilimim */
    long start = k * N / T, end = (k + 1) * N / T;
    long s = 0;
    for (long i = start; i < end; i++)
        s += a[i];
    partial[k] = s;                   /* gözüm   */
    return NULL;
}

/* main() içinde: */
for (long k = 0; k < T; k++)
    pthread_create(&th[k], NULL, sum_slice, (void *)k);
for (long k = 0; k < T; k++) {
    pthread_join(th[k], NULL);
    total += partial[k];
}
/* tam program (zaman ölçümü, 20 tekrar): code/array_sum.c */
