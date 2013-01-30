var nodemailer = require("nodemailer"),
					
	smtp_transport = nodemailer.createTransport("SMTP",{
    				service: "Gmail",
    				auth: {
        					user: "pairit3@gmail.com",
        					pass: "pairitpairit"
    					}
					});


exports.transport = smtp_transport;

exports.callbackURL = "http://localhost:8000/validate?i="