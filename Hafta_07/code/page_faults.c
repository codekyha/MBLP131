/* page_faults.c -- isteğe bağlı sayfalamayı izleyin.
 * malloc() yalnızca SANAL bellek ayırır. Fiziksel çerçeveler bize her
 * sayfaya ilk dokunduğumuz anda, sayfa sayfa verilir. Her ilk dokunuş,
 * çekirdeğin saydığı bir (küçük/minor) sayfa hatasıdır.
 * Derleme:  gcc -Wall -O2 page_faults.c -o page_faults
 * Çalıştır: ./page_faults        ya da   /usr/bin/time -v ./page_faults
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/resource.h>

#define MB (1024L * 1024L)

static long minor_faults(void)          /* bu sürecin şimdiye kadarki hataları */
{
    struct rusage ru;
    getrusage(RUSAGE_SELF, &ru);
    return ru.ru_minflt;                /* minor = disk G/Ç'si gerekmez */
}

int main(void)
{
    long page = sysconf(_SC_PAGESIZE);  /* genellikle 4096 bayt */
    long size = 64 * MB;
    long pages = size / page;
    printf("page size %ld bytes; array %ld MB = %ld pages\n",
           page, size / MB, pages);

    long f0 = minor_faults();
    char *a = malloc(size);             /* yalnızca sanal alan */
    if (a == NULL) { perror("malloc"); return 1; }
    long f1 = minor_faults();
    printf("after malloc       : %6ld new faults\n", f1 - f0);

    for (long i = 0; i < size; i += page)
        a[i] = 1;                       /* her sayfaya ilk dokunuş */
    long f2 = minor_faults();
    printf("first touch (write): %6ld new faults\n", f2 - f1);

    for (long i = 0; i < size; i += page)
        a[i] += 1;                      /* sayfalar artık bellekte */
    long f3 = minor_faults();
    printf("second touch       : %6ld new faults\n", f3 - f2);

    free(a);
    return 0;
}
