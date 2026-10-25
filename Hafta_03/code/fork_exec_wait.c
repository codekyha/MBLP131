/* fork_exec_wait.c -- kabuktan çalıştırdığınız her programı yaratan
 * üç sistem çağrısı: fork(), exec(), wait().
 * Derleme:  gcc -Wall -O2 fork_exec_wait.c -o fork_exec_wait
 * Çalıştır: ./fork_exec_wait
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>      /* fork, execlp, getpid, getppid */
#include <sys/wait.h>    /* waitpid, WEXITSTATUS          */

int main(void)
{
    printf("parent: my PID is %d\n", getpid());
    fflush(stdout);              /* fork'tan ÖNCE tamponu boşalt */

    pid_t pid = fork();          /* bir süreç çağırır, iki süreç döner */

    if (pid < 0) {               /* fork başarısız oldu */
        perror("fork");
        return 1;
    }
    if (pid == 0) {              /* ---- çocuk: fork 0 döndürdü */
        printf("child : PID %d, my parent is %d\n",
               getpid(), getppid());
        fflush(stdout);
        /* bu programı ps ile değiştir; ps yalnızca ebeveyni
         * ve çocuğu (= kendisini!) listelesin               */
        char list[32];
        snprintf(list, sizeof list, "%d,%d", getppid(), getpid());
        execlp("ps", "ps", "-o", "pid,ppid,stat,comm",
               "-p", list, NULL);
        perror("execlp");        /* yalnızca exec başarısızsa */
        exit(127);
    }
    /* ---- ebeveyn: fork çocuğun PID'sini döndürdü */
    int status;
    waitpid(pid, &status, 0);    /* çocuk bitene kadar uyu */
    printf("parent: child %d finished, exit status %d\n",
           pid, WEXITSTATUS(status));
    return 0;
}
