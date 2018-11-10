cd /etc/logrotate.d

cd /var/log/nginx
sudo nano /etc/nginx/nginx.conf

sudo logrotate --force /etc/logrotate.d/nginx

nano /etc/logrotate.d/nginx

$ sudo rm -f /var/log/nginx/*
$ sudo nginx -s reload

chown nginx:nginx /var/lib/nginx

ls -l /var/log/nginx
/var/log/nginx/*log* {
  daily
  compress
  delaycompress
  rotate 2
  missingok
  nocreate
  sharedscripts
  postrotate
    [ ! -f /run/nginx.pid ] || kill -USR1 `cat /run/nginx.pid`
  endscript
}

sudo fuser -k 80/tcp
service nginx start