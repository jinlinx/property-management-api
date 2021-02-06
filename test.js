const p = require('./api/gimports/importMatchPayments');
const db = require('./api/lib/db');
process.env.DBHOST = '192.168.1.41';
p.importAndMatchPayments().then(() => {
    db.conn.end();
})