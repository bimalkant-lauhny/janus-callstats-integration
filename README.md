# janus-callstats-integration

Intermediate server that receives events from Janus-gateway and send stats to callstats.io using Callstats REST API

**NOTE**: This repo is a part of my [GSOC 2017 Project](https://summerofcode.withgoogle.com/projects/#4710360429887488).
This is a prototype of a part of the original project ([callstats.io](https://callstats.io)
Integration into [Janus-gateway](https://github.com/meetecho/janus-gateway)).
The aim was to get a basic understanding of the [callstats.io REST API](http://docs.callstats.io).

<br />

### Instructions to Run

1. Edit `/opt/janus/etc/janus/janus.cfg` with `sudo` as follows -
  Find code snippet -
  ```C
  ; broadcast = yes
  ```
  uncomment it to -
  ```C
  broadcast = yes
  ```

2. Edit `/opt/janus/etc/janus/janus.eventhandler.sampleevh.cfg` as follows -
  set the values as follows -
  ```C
  enabled = yes
  ```

  ```C
  backend: http://localhost:8080/
  ```

3. git clone this repo anywhere  

4. Generate you private key, public key and certificate.

  ```
  openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout server.key -out server.crt -passin pass:v2ZIZj2jKUap -subj '/CN=localhost/O=Local/C=FI'
cp server.crt ca.crt
  ```

  ```
  openssl ecparam -name prime256v1 -genkey > ecpriv.key
  openssl ec -in ecpriv.key -pubout -out ecpubkey.pem
  ```

5. Edit `config.js` and set your callstats.io credentials and key file paths.

6. Run the server as `node index.js` (make sure that 8080 port is available)
