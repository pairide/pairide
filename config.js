// Define API keys for RECAPTCHA used in generating CAPTCHA images in the
// application. Keys can be obtained here:
// https://www.google.com/recaptcha/admin/create
var PUBLIC_KEY  = '6LfvENQSAAAAABG-fEVrexCHGCvk2zR3EahI27Sv',
    PRIVATE_KEY = '6LfvENQSAAAAACO6IgSOV8HPUXczLKmx9NLsg9G3';

exports.PUBLIC_KEY = PUBLIC_KEY;
exports.PRIVATE_KEY = PRIVATE_KEY;

// Validation callback URL. This is the URL a user is sent to
// after email validation.
exports.callbackURL = "http://pairide.com/";

// Define a valid GMail user/password used for sending email
// notifications.
exports.email_user = "pairit3@gmail.com";
exports.email_pass = "pairitpairit";
// From address to be used while sending an email.
exports.email_from_address = "PairIDE <pairit3@gmail.com>";

// Default PORT for running the application.
exports.DEFAULT_PORT = "80";

exports.app_dir = __dirname;
