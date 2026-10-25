/* mem_layout.c -- where do code, globals, heap and stack live?
 * Prints the (virtual) address of one object from each region of the
 * process memory layout (Week 3), then the page size.
 * Compile:  gcc -Wall -O2 mem_layout.c -o mem_layout
 * Run:      ./mem_layout
 * Finally it prints the lines of its own /proc/self/maps that
 * describe the program file, the heap and the stack, so you can
 * check which region each address falls into.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int initialised_global = 42;   /* data segment              */
int uninitialised_global;      /* bss segment (zero-filled)  */

/* print the lines of /proc/self/maps for the program file, heap and
 * stack, shortened to: address range, permissions, name            */
static void show_maps(void)
{
    char line[512], range[64], perms[8], name[256];
    FILE *f = fopen("/proc/self/maps", "r");
    if (f == NULL) return;
    while (fgets(line, sizeof line, f)) {
        name[0] = '\0';
        sscanf(line, "%63s %7s %*s %*s %*s %255s", range, perms, name);
        if (strstr(name, "mem_layout") || strcmp(name, "[heap]") == 0 ||
            strcmp(name, "[stack]") == 0) {
            char *base = strrchr(name, '/');      /* drop the directory */
            printf("%s %s %s\n", range, perms, base ? base + 1 : name);
        }
    }
    fclose(f);
}

int main(void)
{
    int local = 7;                          /* stack                    */
    int *dynamic = malloc(sizeof(int));     /* heap                     */
    if (dynamic == NULL) return 1;
    *dynamic = 99;

    printf("text  (code)   main()      : %p\n", (void *)main);
    printf("data  (global) initialised : %p\n", (void *)&initialised_global);
    printf("bss   (global) zero-filled : %p\n", (void *)&uninitialised_global);
    printf("heap  (malloc)             : %p\n", (void *)dynamic);
    printf("stack (local variable)     : %p\n", (void *)&local);
    printf("page size                  : %ld bytes\n", sysconf(_SC_PAGESIZE));
    printf("\n--- my regions in /proc/self/maps ---\n");
    show_maps();

    free(dynamic);
    return 0;
}
