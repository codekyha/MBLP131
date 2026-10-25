long counter = 0;
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void *worker(void *arg)
{
    for (long i = 0; i < N; i++) {
        pthread_mutex_lock(&lock);    /* giriş */
        counter++;                    /* kritik
                                         bölge */
        pthread_mutex_unlock(&lock);  /* çıkış */
    }
    return NULL;
}
/* main() aynı; programın tamamı:
   code/race_fixed.c */
