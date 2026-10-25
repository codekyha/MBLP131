/* cpu_hog.c -- yalnızca işlemci zamanı yakan bir program (saf "CPU patlaması").
 * Linux zamanlayıcısının TEK bir işlemciyi farklı nice değerli iki
 * programa nasıl paylaştırdığını izlemek için kullanılır.
 * Derleme:   gcc -Wall -O2 cpu_hog.c -o cpu_hog
 * Çalıştır (1 numaralı işlemcide iki program, biri daha "nazik"):
 *   taskset -c 1 ./cpu_hog &
 *   taskset -c 1 nice -n 10 ./cpu_hog &
 *   sleep 10; ps -o pid,ni,cls,pcpu,comm -C cpu_hog; pkill cpu_hog
 */
int main(void)
{
    volatile unsigned long x = 0;   /* volatile: döngü silinmesin */
    for (;;)
        x++;                        /* hiç bloklanmaz, hiç bitmez */
}
