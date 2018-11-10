# The problem:
nginx will create it's log files when it runs.
logrotate will also create log files FOR nginx after the logs has been rotated.
However, nginx and logrotate have different permissions.

- In the begining of the nginx.conf, if we have `user <nginx>`, the nginx will run on behalf of nginx (instead of root).
- logrotate is always running on behalf of root.

so, the log files created by logrotate will not be accessble to `nginx`

# Consequence:
logroteate will prevent nginx from operating correctly, the client reported around 50% of failure rate.

# Solution:
Our ultimate goal is to make logrotate to create log files that is accessble to nginx.
## 1. Change logrotate.d/nginx configuration 

   you will find logrotate configuration files under `/etc/logrotate.d/nginx`:
   
   DO NOT use `reopen_log` that comes with nginx when you set up `user <nginx>`. Use the following:
   ```
   /var/log/nginx/*log* { # make sure this is the log route for your nginx
      daily
      compress
      delaycompress
      rotate 2
      missingok
      nocreate
      sharedscripts
      postrotate
        [ ! -f /run/nginx.pid ] || kill -USR1 `cat /run/nginx.pid` # make sure this is your pid route for nginx
      endscript
    }
    
    ```
## 2. Make logs accessble 

  when you do `sudo service nginx start`, the log files are created by root( or the user you ssh'ed in ). 
  
  logrotate have no permission to modify the log files (normally in `/var/log/nginx` or as you specified) at this time.
  You need to:
  * 2.1 Purge the log files: `$ sudo rm -f /var/log/nginx/*`
  * 2.2 Let nginx create files using it's own user: `$ sudo nginx -s reload`

  Now, when you cd to the log file (`/var/log/nginx`), do `ls -l`, you sould be able to see:
  ```
  -rw-r--r-- 1 nginx root     3993 Nov 10 00:42 access.log
  -rw-r--r-- 1 nginx root        0 Nov 10 00:42 error.log
  ```

## 3. test out:

  Use command 
  ```
  sudo logrotate --force /etc/logrotate.d/nginx -d
  ```
  to force a logrotate.

  go to `/var/log/nginx` to confirm:
  * if the zp log files has been successfully created.
  * if nginx is writing to the log files correctly (is the main log file size growing?)

## NOTE:
You might need to change a few file's permission when launch nginx with `(sudo) service nginx start`. Otherwise nginx will always create log files with root.

### some relavent commands are in `./nginx.sh` file