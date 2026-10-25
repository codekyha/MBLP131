/* catch.c -- a process that handles some signals itself.
 * SIGINT (Ctrl+C, 2) and SIGTERM (kill, 15) are caught: the program
 * prints a message and carries on (or, for SIGTERM, cleans up and exits).
 * SIGKILL (9) and SIGSTOP (19) can NEVER be caught: the kernel acts alone.
 * Compile:  gcc -Wall -O2 catch.c -o catch
 * Run:      ./catch &    then   kill -INT %1 ; kill %1    (or kill -9 %1)
 */
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t got = 0;          /* last signal received */

static void handler(int sig) { got = sig; }    /* keep handlers tiny */

int main(void)
{
    struct sigaction sa;
    memset(&sa, 0, sizeof sa);
    sa.sa_handler = handler;
    sigaction(SIGINT, &sa, NULL);              /* install for SIGINT  */
    sigaction(SIGTERM, &sa, NULL);             /* and for SIGTERM     */
    if (sigaction(SIGKILL, &sa, NULL) < 0)     /* not allowed: fails  */
        perror("catch: sigaction(SIGKILL)");

    printf("catch: PID %d, waiting for signals\n", (int)getpid());
    fflush(stdout);
    for (;;) {
        pause();                               /* sleep until a signal */
        if (got == SIGINT)
            printf("catch: got SIGINT (2) -- ignoring it, still running\n");
        if (got == SIGTERM) {
            printf("catch: got SIGTERM (15) -- cleaning up, bye\n");
            return 0;                          /* a polite exit */
        }
        fflush(stdout);
        got = 0;
    }
}
