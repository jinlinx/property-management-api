const db = require('../lib/db');
const models = require('../models/index');
const keyBy = require('lodash/keyBy');
const uuid = require('uuid');
const { join } = require('bluebird');

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
    //joins:{ table:{col:als}}
    const { table, fields, joins, order } = req.body;
    const model = models[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    createFieldMap(model);

    const selectNames = fields ? fields.filter(f => `${table}.${model.fieldMap[f]}`) : model.fields.map(f => `${table}.${f.field}`);

    let orderby = '';
    if (order && order.length) {
      const orders = order.filter(o => model.fieldMap[o.name]).map(o => ` ${o.name} ${o.asc ? 'ASC' : 'DESC'}`);
      if (orders.length) {
        orderby = ` order by ${orders.join(', ')}`;
      }
    }

    let joinSels = [];
    let joinTbls = [];
    if (joins) {
      const joinRes = model.fields.reduce((acc, f) => {
        const fk = f.foreignKey;
        if (fk) {
          const joinFields = joins[fk.table];
          if (joinFields) {
            const fkModel = models[fk.table];
            acc.innerJoins.push(` inner join ${fk.table} on ${table}.${f.field}=${fk.table}.${fk.field} `);
            acc.selects = acc.selects.concat(fkModel.fields.filter(f=>joinFields[f.field]).map(f=>`${fk.table}.${f.field} '${joinFields[f.field]}'`));
          }
        }
        return acc;
      }, {
        selects:[],
        innerJoins:[],
      });
      joinSels = joinRes.selects;
      joinTbls = joinRes.innerJoins;
    }

    const sqlStr = `select ${selectNames.concat(joinSels).join(',')} from ${[table].concat(joinTbls).join(' ')} ${orderby}`;
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

const vmap = (v, formatter) => {
  if (v === null) return 'null';
  if (v === 0) return 0;
  if (v === '') return "''";
  if (v === undefined) v = '';
  if (formatter) return formatter(v);
  return `'${v}'`
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
    
    let idVal = '';
    if (create) {

      sqlStr = `insert into ${table} (${model.fields.map(f => f.field).join(',')})
       values (${model.fields.map(f => {
         let val = fields[f.field];
         if (f.isId) {
           idVal = uuid.v1();
           val= idVal;
         }
         if (f.formatter) return f.formatter(val);
         return vmap(val);
       }).join(',')})`;
    } else {
      const { idField, values } = model.fields.reduce((acc, mf) => {
        if (mf.isId) {
          acc.idField = { name: mf.field, value: fields[mf.field] };
        } else {
          const v = fields[mf.field];
          if (v !== undefined) {
            acc.values.push({
              name: mf.field,
              value: (mf.formatter|| vmap)(v),
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
      const setValMap = v=>`${v.name}=${v.value}`;
      sqlStr = `update ${table} set ${values.map(v=>setValMap(v)).join(',')} where ${idField.name}=${vmap(idField.value)}`;
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


async function del(req, res) {
  try {
    const { table, id} = req.body;
    const model = models[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    createFieldMap(model);

    const idField = model.fields.filter(f => f.isId)[0];
    const sqlStr = `delete from ${table} where ${idField.field}=${vmap(id)}`;
    
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
  
module.exports = {
  doQuery,
  get,
  createOrUpdate,
  del,
}