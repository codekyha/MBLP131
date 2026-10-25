/* hello_syscall.c -- aynı mesaj, iki yolla yazdırılır.
 * Derleme:  gcc hello_syscall.c -o hello_syscall
 * Çalıştır: ./hello_syscall
 * İzle:     strace ./hello_syscall     (yalnızca Linux)
 */
#include <stdio.h>  /* printf: kütüphane (kullanıcı modu) */
#include <unistd.h> /* write:  sistem çağrısı sarmalayıcısı */

int main(void)
{
    /* 1) Kütüphane çağrısı: printf metni kullanıcı
     *    modunda biçimlendirir, sonra write() ile
     *    çekirdeğe yazdırır.                    */
    printf("Hello from printf!\n");
    fflush(stdout);

    /* 2) Doğrudan sistem çağrısı: dosya tanımlayıcısı
     *    1 = ekran (standart çıktı), 20 = bayt sayısı. */
    write(1, "Hello from write()!\n", 20);

    return 0;
}
