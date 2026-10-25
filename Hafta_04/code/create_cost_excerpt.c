#define N 5000
void *nothing(void *arg) { return arg; }

/* 1) N süreç */
for (int i = 0; i < N; i++) {
    pid_t pid = fork();            /* süreci kopyala   */
    if (pid == 0) _exit(0);        /* çocuk çıkar      */
    waitpid(pid, NULL, 0);
}
/* 2) N iş parçacığı */
for (int i = 0; i < N; i++) {
    pthread_t t;
    pthread_create(&t, NULL, nothing, NULL);
    pthread_join(t, NULL);
}
/* programın tamamı: code/create_cost.c */
