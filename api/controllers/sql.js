const db = require('../lib/db');
const models = require('../models/index');
const keyBy = require('lodash/keyBy');

async function doQuery(req, res) {
    try {
        const rows = await db.doQuery(req.query.sql);
  
      return res.json(rows);
    } catch (err) {
      console.log(err);
      res.send(500, {
        sql: req.query.sql,
        message: err.message,
       errors: err.errors
      });
    }
}


function createFieldMap(model) {
  if (!model.fieldMap) {
    model.fieldMap = keyBy(model.fields, 'field');
  }
}
async function get(req, res) {
  try {
    const { table, fields, order } = req.body;
    const model = models[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    createFieldMap(model);

    const selects = fields ? fields.filter(f => model.fieldMap[f]).join(',') : model.fields.map(f => f.field).join(',');

    let orderby = '';
    if (order && order.length) {
      const orders = order.filter(o => model.fieldMap[o.name]).map(o => ` ${o.name} ${o.asc ? 'ASC' : 'DESC'}`);
      if (orders.length) {
        orderby = ` order by ${orders.join(' ')}`;
      }
    }

    const sqlStr = `select ${selects} from ${table} ${orderby}`;
    const rows = await db.doQuery(sqlStr);

    return res.json(rows);
  } catch (err) {
    console.log(err);
    res.send(500, {
      message: err.message,
      errors: err.errors
    });
  }
}
  
module.exports = {
  doQuery,
  get,
}