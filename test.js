const p = require('./api/gimports/importMatchPayments');
const db = require('./api/lib/db');
p.importAndMatchPayments().then(() => {
    db.conn.end();
})