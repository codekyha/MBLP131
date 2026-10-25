/* fork_vaddr.c -- same virtual address, different values.
 * After fork() the child is a copy of the parent. Both processes
 * print the address of the SAME variable -- and get the same number.
 * Yet the child changes the value and the parent does not see it:
 * the address is a *virtual* (logical) address, and the MMU maps it
 * to different physical frames in the two processes.
 * Compile:  gcc -Wall -O2 fork_vaddr.c -o fork_vaddr
 */
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int x = 100;                     /* one global variable */

int main(void)
{
    pid_t pid = fork();          /* now there are two processes */

    if (pid == 0) {              /* ---- child ---- */
        x = 200;                 /* change OUR copy only        */
        printf("child  (PID %d): &x = %p   x = %d\n",
               getpid(), (void *)&x, x);
        return 0;
    }
    wait(NULL);                  /* ---- parent: wait for the child */
    printf("parent (PID %d): &x = %p   x = %d\n",
           getpid(), (void *)&x, x);
    return 0;
}
