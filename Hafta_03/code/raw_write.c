/* raw_write.c -- tek mesaj, üç düzey: kütüphane, sarmalayıcı, çıplak tuzak.
 * Bir sistem çağrısının bir NUMARA ile seçildiğini ve parametrelerinin
 * işlemci yazmaçlarında taşındığını gösterir (yalnızca x86-64 Linux).
 * Derleme:  gcc -Wall -O2 raw_write.c -o raw_write
 * İzle:     strace ./raw_write
 */
#include <stdio.h>    /* printf: C kütüphanesi (kullanıcı modu) */
#include <unistd.h>   /* write : ince libc sarmalayıcısı        */

int main(void)
{
    printf("1) printf  -> libc -> write\n");     /* düzey 1 */
    fflush(stdout);

    /* düzey 2 */
    if (write(1, "2) write() -> libc wrapper\n", 27) != 27)
        return 1;

    /* düzey 3: sarmalayıcının yaptığını elle yapıyoruz.
     *   rax = 1   write'ın sistem çağrısı numarası (x86-64)
     *   rdi = 1   1. parametre: dosya tanımlayıcısı (stdout)
     *   rsi = msg 2. parametre: baytların adresi
     *   rdx = 26  3. parametre: bayt sayısı
     * 'syscall' komutu çekirdeğe tuzak kurar; çekirdeğin
     * dönüş değeri rax'te geri gelir.                   */
    static const char msg[] = "3) syscall instruction!!!\n";
    long ret;
    __asm__ volatile ("syscall"
                      : "=a"(ret)                /* çıkış: rax */
                      : "a"(1L), "D"(1L), "S"(msg), "d"(26L)
                      : "rcx", "r11", "memory"); /* bozulanlar */
    printf("kernel returned %ld (bytes written)\n", ret);
    return 0;
}
