# demo_dirperm.sh -- what r, w and x mean for a DIRECTORY
mkdir box
echo "top secret" > box/secret.txt
ls -ld box
chmod u-x box
ls -ld box
ls box
ls -l box
cd box
cat box/secret.txt
chmod u-r,u+x box
ls -ld box
ls box
cat box/secret.txt
chmod 755 box
chmod 444 box/secret.txt
ls -l box
echo "more" >> box/secret.txt
rm box/secret.txt #<< y
ls box
chmod 555 box
touch box/new.txt
chmod 755 box
