/* mem_layout.c -- bir sürecin parçaları bellekte nerede durur?
 * Süreç görüntüsünün her bölgesinden birer adres yazdırır.
 * Derleme:  gcc -Wall -O2 mem_layout.c -o mem_layout
 * Çalıştır: ./mem_layout  (iki kez çalıştırın: adresler değişir,
 *                          çünkü Linux onları rastgele yerleştirir: ASLR)
 */
#include <stdio.h>
#include <stdlib.h>

int initialised = 42;   /* değeri olan global   -> data */
int uninitialised;      /* değeri olmayan global -> bss  */

int main(void)
{
    int local = 7;                   /* yerel değişken -> yığıt */
    int *dynamic = malloc(sizeof *dynamic);     /* malloc -> öbek */

    printf("text  main()        %p\n", (void *)main);
    printf("data  initialised   %p\n", (void *)&initialised);
    printf("bss   uninitialised %p\n", (void *)&uninitialised);
    printf("heap  *dynamic      %p\n", (void *)dynamic);
    printf("stack local         %p\n", (void *)&local);

    free(dynamic);
    return 0;
}
