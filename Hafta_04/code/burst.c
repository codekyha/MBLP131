/* burst.c -- tek dosyada bir CPU yoğun ve bir G/Ç yoğun program.
 *   ./burst cpu : tek, uzun bir CPU patlaması (yalnızca aritmetik, G/Ç yok)
 *   ./burst io  : 1000 kısa CPU patlaması, her birinin ardından G/Ç beklemesi
 *                 (dosyaya 4 KB yaz, sonra fsync = "veri gerçekten diske
 *                 yazılana kadar bekle")
 * Derleme:  gcc -Wall -O2 burst.c -o burst
 * Ölçüm:    time ./burst cpu      time ./burst io
 */
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

static void cpu_bound(void)
{
    volatile double x = 0;                 /* volatile: döngü silinmesin */
    for (long i = 1; i <= 400000000L; i++)
        x += 1.0 / i;                      /* yalnızca CPU işi */
    printf("cpu: harmonic sum = %.6f\n", x);
}

static void io_bound(void)
{
    char buf[4096];
    memset(buf, 'x', sizeof buf);
    int fd = open("burst.tmp", O_WRONLY | O_CREAT | O_TRUNC, 0644);
    if (fd < 0) { perror("open"); return; }
    for (int i = 0; i < 1000; i++) {
        buf[0] = 'A' + i % 26;             /* kısa CPU patlaması ...  */
        if (write(fd, buf, sizeof buf) < 0) /* ... ardından G/Ç isteği */
            perror("write");
        fsync(fd);                         /* diske yazılana dek bloke */
    }
    close(fd);
    unlink("burst.tmp");
    printf("io: wrote 1000 blocks of 4 KB, each followed by fsync\n");
}

int main(int argc, char *argv[])
{
    if (argc > 1 && strcmp(argv[1], "io") == 0)
        io_bound();
    else
        cpu_bound();
    return 0;
}
