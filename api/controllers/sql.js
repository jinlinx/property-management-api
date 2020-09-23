const db = require('../lib/db');

async function doQuery(req, res) {
    try {
        const res = await db.doQuery(req.query.sql);
  
      return res.json(res);
    } catch (err) {
      console.log(err);
      res.send(500, {
        sql: req.query.sql,
        message: err.message,
       errors: err.errors
      });
    }
}
  
module.exports = {
    doQuery,
}