/* hello_syscall.c -- aynı mesajı iki farklı yolla yazdırmak.
 * Derleme   : gcc hello_syscall.c -o hello_syscall
 * Çalıştırma: ./hello_syscall
 * İzleme    : strace ./hello_syscall   (yalnızca Linux)
 */
#include <stdio.h>   /* printf: kütüphane fonksiyonu */
#include <unistd.h>  /* write: sistem çağrısı sarmalayıcısı */

int main(void)
{
    /* 1) Kütüphane çağrısı: printf metni kullanıcı modunda
     *    biçimlendirir, sonra write() ile çekirdeğe yazdırır. */
    printf("printf ile merhaba!\n");
    fflush(stdout);

    /* 2) Doğrudan sistem çağrısı: 1 numaralı dosya tanımlayıcısı
     *    = ekran (standart çıktı); 21 = yazılacak bayt sayısı. */
    write(1, "write() ile merhaba!\n", 21);

    return 0;
}
