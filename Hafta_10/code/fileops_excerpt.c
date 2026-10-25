CHECK(mkdir("box", 0775));                               /* mkdir box         */
CHECK(fd = open("box/a.txt", O_WRONLY | O_CREAT, 0664)); /* touch box/a.txt   */
CHECK(write(fd, "hello\n", 6));  CHECK(close(fd));
CHECK(link("box/a.txt", "box/b.txt"));                   /* ln a.txt b.txt    */
CHECK(symlink("a.txt", "box/s.txt"));                    /* ln -s a.txt s.txt */
CHECK(rename("box/a.txt", "box/c.txt"));                 /* mv a.txt c.txt    */
CHECK(unlink("box/b.txt"));                              /* rm b.txt          */
if (rmdir("box") == -1) perror("rmdir(\"box\")");        /* not empty: fails  */
CHECK(unlink("box/c.txt"));  CHECK(unlink("box/s.txt")); /* rm c.txt s.txt    */
CHECK(rmdir("box"));                                     /* rmdir box: now OK */
