int initialised_global = 42;   /* data segment             */
int uninitialised_global;      /* bss segment (zero-filled) */

int main(void)
{
    int local = 7;                        /* stack */
    int *dynamic = malloc(sizeof(int));   /* heap  */

    printf("text  (code)   main()      : %p\n", (void *)main);
    printf("data  (global) initialised : %p\n",
           (void *)&initialised_global);
    printf("bss   (global) zero-filled : %p\n",
           (void *)&uninitialised_global);
    printf("heap  (malloc)             : %p\n", (void *)dynamic);
    printf("stack (local variable)     : %p\n", (void *)&local);
    printf("page size                  : %ld bytes\n",
           sysconf(_SC_PAGESIZE));
    show_maps();   /* print our lines of /proc/self/maps */
    free(dynamic);
}
/* full program: code/mem_layout.c */
