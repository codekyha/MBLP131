int shared_counter = 0;          /* global: TEK kopya */

void *worker(void *arg)
{
    int my_number = *(int *)arg; /* KENDİ yığıtımda */
    printf("thread %d: PID = %d, TID = %d\n",
           my_number, getpid(), gettid());
    shared_counter++;
    return NULL;
}

int main(void)
{
    pthread_t tid[3];  int number[3];
    for (int i = 0; i < 3; i++) {
        number[i] = i + 1;
        pthread_create(&tid[i], NULL, worker, &number[i]);
    }
    for (int i = 0; i < 3; i++)
        pthread_join(tid[i], NULL);   /* bekle */
    printf("shared_counter = %d\n", shared_counter);
}
/* programın tamamı: code/thread_hello.c */
