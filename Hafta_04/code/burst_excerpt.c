/* ./burst cpu : tek, uzun bir CPU patlaması */
for (long i = 1; i <= 400000000L; i++)
    x += 1.0 / i;

/* ./burst io : 1000 x (kısa CPU + G/Ç beklemesi) */
for (int i = 0; i < 1000; i++) {
    buf[0] = 'A' + i % 26;     /* CPU    */
    write(fd, buf, 4096);      /* G/Ç... */
    fsync(fd);                 /* ...diski bekle */
}
/* programın tamamı: code/burst.c */
