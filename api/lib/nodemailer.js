'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');

function sendGmail(mailOptions) {
    const auth = JSON.parse(fs.readFileSync('./credentials.json').toString()).emailInfo;
    return new Promise((resolve, reject) => {
        nodemailer.createTestAccount((err, account) => {
            const transporter = nodemailer.createTransport({
                host: 'smtp.googlemail.com', // Gmail Host
                port: 465, // Port
                secure: true, // this is true as port is 465
                auth,
            });

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                console.log('Message sent: %s', info.messageId);
                resolve(info);
            });
        });
    });
}

module.exports = {
    sendGmail,
};