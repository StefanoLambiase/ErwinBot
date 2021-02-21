// Import library for mail sending.
const nodemailer = require('nodemailer');

/**
 * Implement the functionality that send an email using the bot mail account.
 * @param {string} from - The sender.
 * @param {string} to - The receiver.
 * @param {string} subject - Email subject.
 * @param {string} htmlToSend - Email text as HTML.
 */
function sendEmail(from, to, subject, htmlToSend) {
    console.log('\n** MAIL SENDER SERVICE **\n');

    // Create credential and SMTP server.
    const transport = nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
            user: process.env.MailtrapUsername, // mailtrap credentials in .env file.
            pass: process.env.MailtrapPassword
        }
    });

    // Create the message to send.
    const message = {
        from: from,
        to: to,
        subject: subject,
        html: htmlToSend
    };

    // Send the email.
    transport.sendMail(
        message,
        function(err, info) {
            if (err) {
                console.log(err);
            } else {
                console.log(info);
            }
        }
    );
}

module.exports = { sendEmail };
