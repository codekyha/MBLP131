/* fileops.c -- Week 10: the system calls behind mkdir, touch, ln, ln -s, mv, rm, rmdir.
 * Every shell command of this week is a small program that calls one or two of
 * these functions (Week 2: system calls; Week 7: inodes and links).
 * Build: gcc -Wall -O2 fileops.c -o fileops      Run it inside ~/lab:  ./fileops
 */
#include <stdio.h>
#include <fcntl.h>      /* open()                                   */
#include <unistd.h>     /* write(), close(), link(), unlink() ...   */
#include <sys/stat.h>   /* mkdir(), lstat()                         */

/* run one system call; on error print the reason (like the shell commands do) and stop */
#define CHECK(call) do { if ((call) == -1) { perror(#call); return 1; } } while (0)

/* print the inode number and the link count of a name (like ls -li) */
static void show(const char *name)
{
    struct stat st;
    if (lstat(name, &st) == -1) { perror(name); return; }   /* lstat: do not follow symlinks */
    printf("  %-10s inode %-7lu links %lu\n", name,
           (unsigned long)st.st_ino, (unsigned long)st.st_nlink);
}

int main(void)
{
    int fd;
    CHECK(mkdir("box", 0775));                                  /* mkdir box         */
    CHECK(fd = open("box/a.txt", O_WRONLY | O_CREAT, 0664));    /* touch box/a.txt   */
    CHECK(write(fd, "hello\n", 6));
    CHECK(close(fd));
    printf("after open(O_CREAT):\n");          show("box/a.txt");

    CHECK(link("box/a.txt", "box/b.txt"));                      /* ln a.txt b.txt    */
    CHECK(symlink("a.txt", "box/s.txt"));                       /* ln -s a.txt s.txt */
    printf("after link() and symlink():\n");
    show("box/a.txt"); show("box/b.txt"); show("box/s.txt");

    CHECK(rename("box/a.txt", "box/c.txt"));                    /* mv a.txt c.txt    */
    printf("after rename() a.txt -> c.txt:\n"); show("box/c.txt");

    CHECK(unlink("box/b.txt"));                                 /* rm b.txt          */
    printf("after unlink() b.txt:\n");          show("box/c.txt");

    if (rmdir("box") == -1)                    /* rmdir box: box is not empty yet */
        perror("rmdir(\"box\")");
    CHECK(unlink("box/c.txt"));                                 /* rm c.txt          */
    CHECK(unlink("box/s.txt"));                                 /* rm s.txt          */
    CHECK(rmdir("box"));                                        /* rmdir box: now OK */
    printf("box removed\n");
    return 0;
}
