# property-management-api

SETUP: must setup
env.JWT_PRIVATE_KEY and JWT_PUBLIC_KEY

config in creds/pienv.txt



sudo apt-get install mariadb-server
mysql -u root
create database PM;

CREATE USER 'jjuser'@'localhost' IDENTIFIED BY '12345';
CREATE USER 'jjuser'@'%' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON PM.* TO 'jjuser'@'%';
GRANT ALL PRIVILEGES ON PM.* TO 'jjuser'@'localhost';
FLUSH PRIVILEGES;


CREATE USER 'lluser'@'localhost' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON PM.* TO 'lluser'@'localhost';
FLUSH PRIVILEGES;


/etc/mysql/mariadb.conf.d
edit 50-server.cnf bind-address            = ::

#crontab -e
# 0 0 * * * curl http://localhost:8081/misc/statement?who=paypal
# 0 10 * * * curl http://localhost:8081/misc/statement?who=venmo


1 0 * * * /home/pi/bibleSender/cronSchedule/doCron.sh /sendToday
0 8 * * 2,5 /home/pi/bibleSender/cronSchedule/doCron.sh /sendHebrewsWeeklyEmail
#0 0 15,28 * * /home/pi/bibleSender/cronSchedule/doCron.sh /sendSantury
0,5,10,15,20,25,30,35,40,45,50,55 9,10,11 * * 0 /home/pi/bibleSender/cronSchedule/doCron.sh /checkChannel

0 0 * * * curl http://localhost:8081/misc/statement?who=paypal
10 0 * * * curl http://localhost:8081/misc/statement?who=venmo
20 0 * * * curl http://localhost:8081/misc/statement?who=cashapp
30 0 * * * curl http://localhost:8081/misc/statement?who=importMatchPayments


openssl ecparam -genkey -name prime256v1 -out keys\ec-jwt-private-key.pem
openssl ec -in keys\ec-jwt-private-key.pem -pubout keys\ec-jwt-public-key.pem