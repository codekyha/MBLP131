/* thread_hello.c -- tek süreç, birkaç iş parçacığı.
 * Her iş parçacığı süreç kimliğini (PID, tüm iş parçacıklarında aynı)
 * ve kendi iş parçacığı kimliğini (TID, her birine özel) yazdırır.
 * Derleme:   gcc -Wall -O2 -pthread thread_hello.c -o thread_hello
 * Çalıştır:  ./thread_hello
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>        /* getpid(), gettid(), sleep() */

#define NTHREADS 3

int shared_counter = 0;    /* global: TEK kopya, tüm iş parçacıkları görür */

/* Her iş parçacığı hayatına bu fonksiyonda başlar. */
void *worker(void *arg)
{
    int my_number = *(int *)arg;   /* yerel: bu iş parçacığının KENDİ yığıtında */
    printf("thread %d: PID = %d, TID = %d\n",
           my_number, getpid(), gettid());
    shared_counter++;              /* (güvenli değil! bkz. 5. hafta) */
    sleep(2);                      /* ps ile izleyebilmek için canlı kal */
    return NULL;
}

int main(void)
{
    pthread_t tid[NTHREADS];       /* iş parçacığı "tutamaçları"  */
    int number[NTHREADS];

    printf("main    : PID = %d, TID = %d\n", getpid(), gettid());
    for (int i = 0; i < NTHREADS; i++) {
        number[i] = i + 1;
        /* worker(&number[i]) fonksiyonunu çalıştıran bir iş parçacığı yarat */
        pthread_create(&tid[i], NULL, worker, &number[i]);
    }
    for (int i = 0; i < NTHREADS; i++)
        pthread_join(tid[i], NULL);  /* i. iş parçacığının bitmesini bekle */

    printf("main    : all threads done, shared_counter = %d\n",
           shared_counter);
    return 0;
}
