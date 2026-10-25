int main(void)
{
    printf("parent: my PID is %d\n", getpid());
    fflush(stdout);            /* fork'tan ÖNCE tamponu boşalt */

    pid_t pid = fork();        /* biri çağırır, ikisi döner */

    if (pid == 0) {            /* ---- çocuk: fork 0 döndürdü */
        printf("child : PID %d, my parent is %d\n",
               getpid(), getppid());
        fflush(stdout);
        char list[32];         /* ps -p için "ebeveyn,çocuk" */
        snprintf(list, sizeof list, "%d,%d", getppid(), getpid());
        execlp("ps", "ps", "-o", "pid,ppid,stat,comm",
               "-p", list, NULL);   /* bu programın yerine geçer */
        exit(127);             /* yalnızca exec başarısızsa */
    }
    int status;                /* ---- ebeveyn */
    waitpid(pid, &status, 0);  /* çocuk bitene kadar uyu */
    printf("parent: child %d finished, exit status %d\n",
           pid, WEXITSTATUS(status));
}
/* hata denetimli tam program: code/fork_exec_wait.c */
