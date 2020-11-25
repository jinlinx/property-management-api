
const email = require('../lib/nodemailer');
function sendEmail(req, res) {
    if (!req.body) {
        return res.send({ err: "no body" });
    }
    const { subject, text, from, to } = req.body;
    if (!subject || !text) {
        return res.send({ err: "no subject or text" });
    }
    //const to = ['a@a.com'];
    //from '"GGBot" <gzhangx@gmail.com>',
    return email.sendHotmail({
        from,
        to,
        subject,
        text
    }).then(inf => {
        return res.send({ message: "ok" });
    });
}

module.exports = {
    sendEmail,
};