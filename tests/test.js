const mail = require('../api/lib/nodemailer');

const sql = require('../api/lib/mysql');

sql.createConn().doQuery(`select * from  test1 where id in (?,?,?)`, [1, 2,3]).then(r => {
    console.log(r);
})
/*
mail.sendHotmail({
    from: 'ggbot <gzhangx1@hotmail.com>',
    to: ['gzhangx@hotmail.com'],
    subject: 'testsub',
    text:'test body'
})

*/