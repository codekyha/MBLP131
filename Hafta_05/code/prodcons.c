/* prodcons.c -- POSIX semaforlarıyla sınırlı tampon üretici-tüketici.
 * Bir üretici 1..ITEMS sayılarını SIZE gözlü bir tampona koyar;
 * bir tüketici onları alır ve toplar.
 *   empty = boş göz sayısı    (başlangıç: SIZE)
 *   full  = dolu göz sayısı   (başlangıç: 0)
 *   mutex = tampon indislerini korur (ikili semafor, başlangıç: 1)
 * Derleme:   gcc -Wall -O2 -pthread prodcons.c -o prodcons
 * Çalıştır:  ./prodcons
 */
#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>

#define SIZE  5                  /* tampon gözleri    */
#define ITEMS 20                 /* aktarılacak öğe   */

int buffer[SIZE];
int in = 0, out = 0;             /* sıradaki doldurulacak / boşaltılacak göz */
sem_t empty, full, mutex;

void *producer(void *arg)
{
    for (int item = 1; item <= ITEMS; item++) {
        sem_wait(&empty);                /* boş göz bekle         */
        sem_wait(&mutex);                /* kritik bölgeye gir    */
        buffer[in] = item;
        in = (in + 1) % SIZE;
        sem_post(&mutex);                /* kritik bölgeden çık   */
        sem_post(&full);                 /* bir dolu göz daha     */
    }
    return NULL;
}

void *consumer(void *arg)
{
    long sum = 0;
    for (int k = 0; k < ITEMS; k++) {
        sem_wait(&full);                 /* dolu göz bekle        */
        sem_wait(&mutex);
        int item = buffer[out];
        out = (out + 1) % SIZE;
        sem_post(&mutex);
        sem_post(&empty);                /* bir boş göz daha      */
        sum += item;
        if (item % 5 == 0)
            printf("consumed %2d   running sum %3ld\n", item, sum);
    }
    printf("sum of 1..%d = %ld (expected %d)\n", ITEMS, sum, ITEMS * (ITEMS + 1) / 2);
    return NULL;
}

int main(void)
{
    pthread_t p, c;
    sem_init(&empty, 0, SIZE);   /* 0 = süreçler değil, iş parçacıkları paylaşır */
    sem_init(&full,  0, 0);
    sem_init(&mutex, 0, 1);
    pthread_create(&p, NULL, producer, NULL);
    pthread_create(&c, NULL, consumer, NULL);
    pthread_join(p, NULL);
    pthread_join(c, NULL);
    sem_destroy(&empty); sem_destroy(&full); sem_destroy(&mutex);
    return 0;
}
