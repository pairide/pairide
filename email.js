/*
 * EMail module for the app.
 */
var nodemailer = require("nodemailer"),
config = require("./config");
					
	smtp_transport = nodemailer.createTransport("SMTP",{
    				service: "Gmail",
    				auth: {
        					user: config.email_user,
        					pass: config.email_pass
    					}
					});

exports.transport = smtp_transport;