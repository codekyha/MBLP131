/* fork_count.c -- n kez fork() çağrısı kaç süreç yaratır?
 * Var olan her süreç her fork()'u yürütür; bu yüzden süreç
 * sayısı her adımda ikiye katlanır: 1 -> 2 -> 4 -> ... -> 2^n.
 * Derleme:  gcc -Wall -O2 fork_count.c -o fork_count
 * Çalıştır: ./fork_count 3            (her süreç bir satır yazar)
 *           ./fork_count 5 | wc -l    (satırları sayın: 32)
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(int argc, char *argv[])
{
    int n = (argc > 1) ? atoi(argv[1]) : 3;
    if (n < 0 || n > 10) n = 3;   /* ölçülü olalım: en çok 1024 */

    for (int i = 0; i < n; i++)
        fork();                   /* ebeveyn DE çocuk DA devam eder */

    printf("PID %6d  parent %6d\n", getpid(), getppid());
    fflush(stdout);

    while (wait(NULL) > 0)        /* tüm çocuklarımı topla,   */
        ;                         /* hiçbiri zombi kalmasın */
    return 0;
}
