/* file_access.c -- sıralı ve doğrudan (göreli) erişim.
 * Sabit boyutlu kayıtlardan oluşan bir dosya: k. kayıt k * RECSZ baytında başlar.
 * Sıralı:   kayıtlar read() ile art arda okunur (dosya işaretçisi ilerler).
 * Doğrudan: lseek() ile doğrudan k. kayda gidilir, sonra read() ya da write().
 * Derleme:  gcc -Wall -O2 file_access.c -o file_access
 */
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

#define RECSZ 32                        /* kayıt başına bayt */
#define NREC  5

int main(void)
{
    char rec[RECSZ];
    int fd = open("students.dat", O_CREAT | O_RDWR | O_TRUNC, 0644);
    if (fd < 0) { perror("open"); return 1; }

    const char *names[NREC] = { "Ayse", "Mehmet", "Elif", "Can", "Zeynep" };
    for (int k = 0; k < NREC; k++) {    /* kayıtları oluştur */
        memset(rec, 0, RECSZ);
        snprintf(rec, RECSZ, "%d %s", k, names[k]);
        if (write(fd, rec, RECSZ) != RECSZ) { perror("write"); return 1; }
    }

    /* 1) Sıralı erişim: başa sar, sonra sırayla oku */
    lseek(fd, 0, SEEK_SET);
    printf("sequential:");
    while (read(fd, rec, RECSZ) == RECSZ)
        printf("  [%s]", rec);
    printf("\n");

    /* 2) Doğrudan erişim: 3. kayda atla (bayt 3 * 32 = 96) */
    off_t pos = lseek(fd, 3 * RECSZ, SEEK_SET);
    if (read(fd, rec, RECSZ) != RECSZ) { perror("read"); return 1; }
    printf("direct: record 3 at byte %ld -> [%s]\n", (long)pos, rec);

    /* 3) Doğrudan yazma: 1. kaydın üzerine yerinde yaz */
    memset(rec, 0, RECSZ);
    snprintf(rec, RECSZ, "1 Mehmet (updated)");
    lseek(fd, 1 * RECSZ, SEEK_SET);
    if (write(fd, rec, RECSZ) != RECSZ) { perror("write"); return 1; }

    lseek(fd, 1 * RECSZ, SEEK_SET);
    if (read(fd, rec, RECSZ) != RECSZ) { perror("read"); return 1; }
    printf("after update: record 1 -> [%s]\n", rec);
    printf("file size: %ld bytes\n", (long)lseek(fd, 0, SEEK_END));

    close(fd);
    return 0;
}
