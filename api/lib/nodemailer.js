'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');

function sendHotmail(mailOptions) {
    const auth = JSON.parse(fs.readFileSync('./credentials.json').toString()).emailInfo;
    return new Promise((resolve, reject) => {
        nodemailer.createTestAccount((err, account) => {
            const transporter = nodemailer.createTransport({
                host: 'smtp-mail.outlook.com', // Gmail Host
                port: 587, // Port
                secureConnection: false, 
                auth,
                tls: {
                    ciphers: 'SSLv3'
                },
            });

            mailOptions.from = auth.user;
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


function sendGmailGoogle(mailOptions) {
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
    sendHotmail,
};