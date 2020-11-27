const mail = require('../api/lib/nodemailer');

mail.sendHotmail({
    from: 'ggbot <gzhangx1@hotmail.com>',
    to: ['gzhangx@hotmail.com'],
    subject: 'testsub',
    text:'test body'
})