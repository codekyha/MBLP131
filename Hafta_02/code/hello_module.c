/* hello_module.c -- en küçük Linux yüklenebilir çekirdek modülü (LKM).
 * Derleme : make        (çekirdek başlık dosyaları paketi gerekir)
 * Yükleme : sudo insmod hello_module.ko
 * Kontrol : lsmod | grep hello   ve   sudo dmesg | tail -2
 * Kaldırma: sudo rmmod hello_module
 * Bunu yalnızca bozmayı göze alabileceğiniz bir sanal makinede deneyin!
 */
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("MBLP131");
MODULE_DESCRIPTION("Merhaba dünya çekirdek modülü");

static int __init hello_init(void)    /* insmod sırasında çalışır */
{
    pr_info("hello_module: loaded into the kernel\n");
    return 0;                          /* 0 = başarılı */
}

static void __exit hello_exit(void)   /* rmmod sırasında çalışır */
{
    pr_info("hello_module: removed from the kernel\n");
}

module_init(hello_init);
module_exit(hello_exit);
