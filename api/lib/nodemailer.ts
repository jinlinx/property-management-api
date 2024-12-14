'use strict';
import * as  nodemailer from 'nodemailer';
import * as fs from 'fs';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import SMTPConnection from 'nodemailer/lib/smtp-connection';

export type IMailOptions = {
    from?: string;
    to: string;
    subject: string;
    text: string;
};

export function sendHotmail(mailOptions: IMailOptions) {
    const auth = JSON.parse(fs.readFileSync('./credentials.json').toString()).emailInfo as SMTPConnection.AuthenticationType;
    const smtpOpts: SMTPPool.Options = {
        host: 'smtp-mail.outlook.com', // Gmail Host
        port: 587, // Port
        //secureConnection: false,
        pool: true,
        auth,
        tls: {
            ciphers: 'SSLv3'
        },
    };
    return new Promise((resolve, reject) => {
        //nodemailer.createTestAccount((err, account) => {
            const transporter = nodemailer.createTransport(smtpOpts);
            mailOptions.from = auth.user;
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                console.log('Message sent: %s', info.messageId);
                resolve(info);
            });
        //});
    });
}


// function sendGmailGoogle(mailOptions) {
//     const auth = JSON.parse(fs.readFileSync('./credentials.json').toString()).emailInfo;
//     return new Promise((resolve, reject) => {
//         nodemailer.createTestAccount((err, account) => {
//             const transporter = nodemailer.createTransport({
//                 host: 'smtp.googlemail.com', // Gmail Host
//                 port: 465, // Port
//                 secure: true, // this is true as port is 465
//                 auth,
//             });

//             transporter.sendMail(mailOptions, (error, info) => {
//                 if (error) {
//                     console.log(error);
//                     return reject(error);
//                 }
//                 console.log('Message sent: %s', info.messageId);
//                 resolve(info);
//             });
//         });
//     });
// }

// module.exports = {
//     sendHotmail,
// };