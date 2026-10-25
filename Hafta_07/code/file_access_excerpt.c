#define RECSZ 32                       /* kayıt başına bayt */
int fd = open("students.dat", O_CREAT | O_RDWR | O_TRUNC, 0644);
/* ... 5 kayıt yazılır: "0 Ayse", "1 Mehmet", ... "4 Zeynep" */

lseek(fd, 0, SEEK_SET);                /* 1) sıralı        */
while (read(fd, rec, RECSZ) == RECSZ)
    printf("  [%s]", rec);

lseek(fd, 3 * RECSZ, SEEK_SET);        /* 2) doğrudan: bayt 96 */
read(fd, rec, RECSZ);

lseek(fd, 1 * RECSZ, SEEK_SET);        /* 3) 1. kaydın üzerine */
write(fd, rec, RECSZ);
close(fd);
/* programın tamamı: code/file_access.c */
