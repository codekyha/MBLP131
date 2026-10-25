static volatile sig_atomic_t got = 0;
static void handler(int sig) { got = sig; }  /* minicik! */

sa.sa_handler = handler;
sigaction(SIGINT,  &sa, NULL);   /* Ctrl+C, 2: yakalanır */
sigaction(SIGTERM, &sa, NULL);   /* kill,  15: yakalanır */
if (sigaction(SIGKILL, &sa, NULL) < 0)  /* 9: reddedilir */
    perror("catch: sigaction(SIGKILL)");

for (;;) {
    pause();                     /* sinyal gelene dek uyu */
    if (got == SIGINT)
        printf("... ignoring it, still running\n");
    if (got == SIGTERM) {
        printf("... cleaning up, bye\n");
        return 0;
    }
}
