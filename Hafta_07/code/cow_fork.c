/* cow_fork.c -- fork() sonrasında yazınca kopyala (3. haftayla bağlantılı).
 * Ebeveyn 32 MB'lık bir tamponu doldurur, sonra fork() yapar. Çocuk önce
 * tamponu yalnızca OKUR (paylaşılan sayfalar: neredeyse hiç hata yok),
 * sonra YAZAR (yazılan her sayfa önce kopyalanır: sayfa başına bir hata).
 * Derleme:  gcc -Wall -O2 cow_fork.c -o cow_fork
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/resource.h>
#include <sys/wait.h>

#define SIZE (32L * 1024 * 1024)

static long minor_faults(void)
{
    struct rusage ru;
    getrusage(RUSAGE_SELF, &ru);
    return ru.ru_minflt;
}

int main(void)
{
    long page = sysconf(_SC_PAGESIZE);
    char *buf = malloc(SIZE);
    if (buf == NULL) { perror("malloc"); return 1; }
    memset(buf, 'A', SIZE);             /* tüm sayfalar artık ebeveynin */
    printf("buffer: %ld pages of %ld bytes\n", SIZE / page, page);
    fflush(stdout);                     /* çıktı tamponu iki kez basılmasın */

    pid_t pid = fork();
    if (pid == 0) {                     /* ---- çocuk ---- */
        volatile long sum = 0;
        long f0 = minor_faults();
        for (long i = 0; i < SIZE; i += page)
            sum += buf[i];              /* oku: sayfalar hâlâ paylaşılıyor */
        long f1 = minor_faults();
        for (long i = 0; i < SIZE; i += page)
            buf[i] = 'B';               /* yaz: her sayfa kopyalanır */
        long f2 = minor_faults();
        printf("child read  all pages: %6ld faults\n", f1 - f0);
        printf("child write all pages: %6ld faults (copy-on-write)\n",
               f2 - f1);
        exit(0);
    }
    wait(NULL);
    printf("parent still sees  '%c'  (its copy was never changed)\n",
           buf[0]);
    free(buf);
    return 0;
}
