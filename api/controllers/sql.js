const db = require('../lib/db');
const models = require('../models/index');
const keyBy = require('lodash/keyBy');
const uuid = require('uuid');

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
        orderby = ` order by ${orders.join(', ')}`;
      }
    }

    const sqlStr = `select ${selects} from ${table} ${orderby}`;
    console.log(sqlStr);
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

async function createOrUpdate(req, res) {
  try {
    const { table, fields, create} = req.body;
    const model = models[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    createFieldMap(model);

    let sqlStr = '';
    const smap = v => {
      if (v === null) return 'null';
      if (v === 0) return 0;
      if (v === '') return "''";
      if (v === undefined) v = '';
      return `'${v}'`
    }
    let idVal = '';
    if (create) {

      sqlStr = `insert into ${table} (${model.fields.map(f => f.field).join(',')})
       values (${model.fields.map(f => {
         const fd = fields[f.field];
         if (f.isId) {
           idVal = uuid.v1();
           return idVal;
         }
         return fd;
       }).map(smap).join(',')})`;
    } else {
      const { idField, values } = model.fields.reduce((acc, mf) => {
        if (mf.isId) {
          acc.idField = { name: mf.field, value: fields[mf.field] };
        } else {
          const v = fields[mf.field];
          if (v !== undefined) {
            acc.values.push({
              name: mf.field,
              value: v,
            })
          }
        }
        return acc;
      }, {
        values:[]
      }); 
      if (!idField) {
        throw 'Id field not specified';
      }
      idVal = idField.value;
      const setValMap = v=>`${v.name}=${smap(v.value)}`;
      sqlStr = `update ${table} set ${values.map(v=>setValMap(v)).join(',')} where ${idField.name}=${smap(idField.value)}`;
    }

    console.log(sqlStr);
    const rows = await db.doQuery(sqlStr);

    rows.id = idVal;
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
  createOrUpdate,
}