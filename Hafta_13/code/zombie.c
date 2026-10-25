/* zombie.c -- make a zombie process on purpose (links to Week 3).
 * The child exits at once with status 7. The parent does NOT call
 * wait() for SECS seconds, so during that time the child is a zombie:
 * finished, but its PID and exit status still sit in the process table.
 * ps shows it with STAT Z and the word <defunct>.
 * Then the parent calls waitpid(): the zombie is "reaped" and disappears.
 * Compile:  gcc -Wall -O2 zombie.c -o zombie
 * Run:      ./zombie 20 &      then   ps -o pid,ppid,stat,cmd
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(int argc, char *argv[])
{
    int secs = (argc > 1) ? atoi(argv[1]) : 30;   /* how long to "forget" */
    pid_t pid = fork();                /* one process becomes two */

    if (pid < 0) { perror("fork"); return 1; }

    if (pid == 0) {                    /* ---- child ---- */
        printf("child  %d: exiting now with status 7\n", (int)getpid());
        exit(7);                       /* terminated -> zombie until reaped */
    }

    /* ---- parent ---- */
    printf("parent %d: child is %d, sleeping %d s without wait()\n",
           (int)getpid(), (int)pid, secs);
    fflush(stdout);
    sleep(secs);                       /* the child stays a zombie meanwhile */

    int status;
    waitpid(pid, &status, 0);          /* collect the exit status: reap */
    printf("parent %d: reaped child %d, exit status %d\n",
           (int)getpid(), (int)pid, WEXITSTATUS(status));
    return 0;
}
