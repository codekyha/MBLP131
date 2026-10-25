pid_t pid = fork();                /* bir süreç ikiye ayrılır */

if (pid == 0) {                    /* ---- çocuk ---- */
    printf("child  %d: exiting now with status 7\n", getpid());
    exit(7);                       /* sonlandı -> toplanana dek zombi */
}
/* ---- ebeveyn: secs saniye boyunca wait() ÇAĞIRMAZ ---- */
printf("parent %d: child is %d, sleeping %d s without wait()\n",
       getpid(), pid, secs);
sleep(secs);                       /* bu sırada çocuk bir zombidir */

waitpid(pid, &status, 0);          /* çıkış durumunu topla (reap) */
printf("parent %d: reaped child %d, exit status %d\n",
       getpid(), pid, WEXITSTATUS(status));
