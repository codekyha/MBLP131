# demo_order.sh -- only ONE class applies: the owner gets the owner bits, even if they are worse
echo "hello" > me.txt
chmod 074 me.txt
ls -l me.txt
cat me.txt
chmod 644 me.txt
cat me.txt
