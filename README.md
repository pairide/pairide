PairIDE
=======

About
-----

PairIDE is a web-application that supports collaborative pair programming (analogous to a Google Docs for programmers) with different features an IDE would ideally provide. Any developer or student is welcome to use this as a tool for collaborating on code snippets or even projects . While the IDE supports pair programming it does not necessarily require you to do so. However, for those who do find they need to work on a project with a partner but can't easily meet up with them in person this application is specifically targeted at you.

This project was initially a product of AngelHack Toronto which was later developed as a capstone-project course at the University of Toronto.


Requirements:
------------

Following list the dependencies for running the application. Other than node.js, all the other requirements are node modules.

 * node.js v0.8.2
 * express 3.0.6
 * socket.io 0.9.13
 * connect-mongo 0.3.2
 * MD5 1.0.3
 * log4js
 * mongoose
 * nodemailer
 * recaptcha
 * bcrypt 0.7.4
 * jquery-file-upload-middleware ([custom version](https://github.com/ayrus/jquery-file-upload-middleware))
  * This module has been mofified and customized to work with PairIDE.


Installation Instructions:
--------------------------

Instructions below are also specific to a machine running Ubuntu. If your targeted environment doesn't run Ubuntu you will have to satisfy the requirements above (specific to the distribution you are using) and then attempt to run the application.

1) Install npm and git:

<code>apt-get install npm git </code>

2) Install the appropriate version of node:

<code>npm install -g n</code><br/>
<code>n 0.8.20</code>

3) Obtain the source of PairIDE:

<code>git clone https://github.com/pairide/pairide.git</code><br/>
<code>cd pairide</code>

4) Install all dependencies:

<code>npm install .</code>

5) Create a user directory.

<code>mkdir users</code>

6) Give “users” directory appropriate permissions. This directory will be used to store user files.

###Configuration:

* In config.js
 * Follow the comments within config.js and change the settings.
* In public/js/basesockets.js
 * Change the “port” parameter as required.

Once installed you may invoke the application, using node app.js

Credits:
--------

This project is maintained by:

* [Alexander Rodrigues](https://github.com/ajrod)
* [Surya Nallu](https://github.com/ayrus)
* [Warren Marivel](https://github.com/ufowam)
