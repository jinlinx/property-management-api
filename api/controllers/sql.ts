import { Request, Response } from 'restify'
const db = require('../lib/db');
import * as  models from '../models/index';
const keyBy = require('lodash/keyBy');
const get = require('lodash/get');
const uuid = require('uuid');
const { formatterYYYYMMDD, extensionFields } = require('../util/util');
import moment from 'moment';

function removeBadChars(str: string) {
  return str.replace(/[^A-Za-z0-9]/g, '');
}

export async function doQuery(req: Request, res: Response) {
  try {
    const rows = await db.doQuery(req.query.sql);
    return res.json(rows);
  } catch (err: any) {
    console.log(err);
    res.send(500, {
      sql: req.query.sql,
      message: err.message,
      errors: err.errors
    });
  }
}


//function createFieldMap(model) {
//  if(!model.fieldMap) {    
//    model.fieldMap = keyBy(model.fields, 'field');
//  }
//}

const goodOps = Object.freeze({
  '>': true,
  '>=': true,
  '=': true,
  '<': true,
  '<=': true,
  '!=': true,
  '<>': true,
}) as { [key: string]: boolean; };

const goodGroupOps = Object.freeze({
  'sum': true
}) as { [key: string]: boolean; };

interface ISqlRequestFieldDef {
  field: string;
  op: string;
  name: string;
}
interface ISqlOrderDef {
  name: string;
  op: 'asc' | 'desc';
}

interface ISqlRequestWhereItem {
  field: string;
  op: string;
  val: string | number;
}

interface ISqlRequest {
  table: string;
  fields: (ISqlRequestFieldDef | string)[];
  joins: any;
  order: ISqlOrderDef[];
  whereArray: ISqlRequestWhereItem[];
  groupByArray: {
    field: string;
  }[];
  offset: number | string;
  rowCount: number | string;
}
export async function doGet(req: Request, res: Response) {
  try {
    //joins:{ table:{col:als}}
    const { table, fields, joins, order,
      whereArray,    //field, op, val
      groupByArray,  //field [{"field":"workerID"}, {"op":"sum", "field":"amount"}]
      offset = 0, rowCount = 2147483647
    } = req.body as ISqlRequest;
    const model = models.data[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }
    const tableOrView = get(model, ['view', 'name'], table);
    const viewFields = (get(model, ['view', 'fields'], []) as models.IDBFieldDef[]).map(f => ({ ...f, field: f.name || f.field }));

    if (parseInt(offset as string) !== offset)
      throw {
        message: 'Bad offset ' + offset
      }
    if (parseInt(rowCount as string) !== rowCount) {
      throw {
        message: 'Bad rowCount ' + rowCount
      }
    }
    //createFieldMap(model);

    const extFields = extensionFields.concat(viewFields)
    const fieldMap = Object.assign({}, model.fieldMap, keyBy(extFields, 'field')) as { [key: string]: models.IDBFieldDef };
    const modelFields = model.fields.concat(extFields);
    const selectNames = fields ? fields.filter(f => fieldMap[f as string] || fieldMap[(f as ISqlRequestFieldDef).field]).map(ff => {
      const f = ff as ISqlRequestFieldDef;
      if (!f.op) return `${tableOrView}.${f}`;
      if (goodGroupOps[f.op]) {
        if (fieldMap[f.field]) {
          return `${f.op}(${tableOrView}.${f.field}) ${removeBadChars(f.name || '')}`;
        }
      }
      if (f.op === 'count') {
        return `count(1) ${removeBadChars(f.name || '')}`;
      }
    }) : modelFields.map(f => `${tableOrView}.${f.field}`);

    let orderby = '';
    if (order && order.length) {
      const orders = order.filter(o => fieldMap[o.name] && o.op).map(o => ` ${o.name} ${o.op === 'asc' ? 'ASC' : 'DESC'}`);
      if (orders.length) {
        orderby = ` order by ${orders.join(', ')}`;
      }
    }

    let joinSels: string[] = [];
    let joinTbls: string[] = [];
    if (joins) {
      const joinRes = model.fields.reduce((acc, f) => {
        const fk = f.foreignKey;
        if (fk) {
          const joinFields = joins[fk.table];
          if (joinFields) {
            const fkModel = models.data[fk.table];
            acc.innerJoins.push(` left outer join ${fk.table} on ${table}.${f.field}=${fk.table}.${fk.field} `);
            acc.selects = acc.selects.concat(fkModel.fields.filter(f => joinFields[f.field]).map(f => `${fk.table}.${f.field} '${joinFields[f.field]}'`));
          }
        }
        return acc;
      }, {
        selects: [] as string[],
        innerJoins: [] as string[],
      });
      joinSels = joinRes.selects;
      joinTbls = joinRes.innerJoins;
    }

    let whereStr = '';
    let wherePrm = [] as (string | number)[];
    if (whereArray) {
      const whereRed = whereArray.reduce((acc, w) => {
        const pushNop = () => {
          acc.whr.push('1=?');
          acc.prms.push('1');
        };
        if (fieldMap[w.field]) {
          if (goodOps[w.op]) {
            acc.whr.push(`${w.field} ${w.op} ?`);
            acc.prms.push(w.val);
          } else {
            console.log(`Warning bad op ${w.field} ${w.op}`);
            pushNop();
          }
        } else {
          console.log(`Warning field not mapped ${w.field}`);
          pushNop();
        }
        return acc;
      }, {
        whr: [] as string[],
        prms: [] as (string | number)[],
      });
      if (whereRed.whr.length) {
        whereStr = ` where ${whereRed.whr.join(' and ')}`;
      }
      wherePrm = whereRed.prms;
    }

    let groupByStr = '';
    if (groupByArray) {
      const groupBys = groupByArray.map(g => g.field).filter(f => fieldMap[f]) as string[];
      if (groupBys.length) {
        groupByStr = ' group by ' + groupBys.join(',');
      }
    }

    const fromAndWhere = ` from ${[tableOrView].concat(joinTbls).join(' ')} ${whereStr} `;
    const sqlStr = `select ${selectNames.concat(joinSels).join(',')} ${fromAndWhere} ${orderby} ${groupByStr}
    limit ${offset}, ${rowCount}`;
    console.log(sqlStr);
    const countRes = await db.doQueryOneRow(`select count(1) cnt ${fromAndWhere}  ${groupByStr}`, wherePrm);
    const rows = await db.doQuery(sqlStr, wherePrm);

    return res.json({
      offset,
      rowCount,
      total: get(countRes, 'cnt'),
      rows,
    });
  } catch (err: any) {
    console.log(err);
    res.send(500, {
      message: err.message,
      errors: err.errors
    });
  }
}

function dateStrFormatter(str: (string|number|null|Date)) :Date {
  return moment(str).toDate();
}
const vmap = (v: any, formatter?: (f: any) => string): string | number => {
  if (v === null) return 'null';
  if (v === 0) return 0;
  if (v === '') return "''";
  if (v === undefined) v = '';
  if (formatter) return formatter(v);
  return `'${v}'`
}

const vmap2 = (v: (models.PossibleDbTypes|undefined), f: models.IDBFieldDef) => {
  if (v === null || v === 0) return v;
  if (v === undefined) v = '';
  if (v === '') {
    if (f.type === 'decimal') return null;
  }
  return v;
}

export async function createOrUpdate(req: Request, res: Response) {
  try {
    const { table } = req.body as ISqlRequest;
    const fields = req.body.fields as { [key: string]: string };
    const { create } = req.body as { create: boolean; }
    const model = models.data[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    //createFieldMap(model);

    let sqlStr = '';

    let idVal = '' as models.PossibleDbTypes;    
    let sqlArgs = [] as models.PossibleDbTypes[];
    if (create) {

      sqlStr = `insert into ${table} (${model.fields.map(f => f.field).join(',')},created,modified)
       values (${model.fields.map((f) => {
        let val = fields[f.field] as models.PossibleDbTypes;
        if (f.isId) {
          idVal = uuid.v1();
          val = idVal;
        }
        if (f.formatter) {
          sqlArgs.push(f.formatter(val));
        } else if (f.autoValueFunc) {
          sqlArgs.push(f.autoValueFunc(fields, f, val))
        }
        else {
          let formatter = ((x: models.PossibleDbTypes) => x);
          if (f.type === 'datetime' || f.type === 'date') {
            formatter = dateStrFormatter;
          }
          sqlArgs.push(formatter(vmap2(val, f)));
        }
        return '?';
        //return vmap(val);
      }).join(',')},NOW(),NOW())`;
    } else {
      interface INameVal {
        name: string;
        value: models.PossibleDbTypes;
      }
      const { idField, values } = model.fields.reduce((acc, mf) => {
        if (mf.isId) {
          acc.idField = { name: mf.field, value: fields[mf.field] };
        } else {
          const v = fields[mf.field];
          if (v !== undefined) {
            let formatter = (v=>'') as (v:models.PossibleDbTypes)=>(string|Date);
            if (mf.type === 'datetime') {
              formatter = dateStrFormatter;
            }
            if (mf.autoValueFunc) {
              formatter = v => mf.autoValueFunc(fields, mf, v as string); //just fake it
            }
            acc.values.push({
              name: mf.field,
              value: ((formatter || mf.formatter || vmap2) as (v: any, f: any) => models.PossibleDbTypes)(v, mf),
            })
          }
        }
        return acc;
      }, {
        idField: null as (null | INameVal),
        values: [] as INameVal[],
      });
      if (!idField) {
        throw 'Id field not specified';
      }
      idVal = idField.value;
      //const setValMap = v => `${v.name}=${v.value}`;
      const setValMap = (v:INameVal) => `${v.name}=?`;
      sqlStr = `update ${table} set ${values.map(v => setValMap(v)).join(',')},modified=NOW() where ${idField.name}=${vmap(idField.value)}`;
      sqlArgs = values.map(v => v.value);
    }

    console.log(sqlStr);
    console.log(sqlArgs);
    const rows = await db.doQuery(sqlStr, sqlArgs);

    rows.id = idVal;
    return res.json(rows);
  } catch (err:any) {
    console.log(err);
    res.send(500, {
      message: err.message,
      errors: err.errors
    });
  }
}


export async function del(req: Request, res: Response) {
  try {
    const { table, id } = req.body;
    const model = models.data[table];
    if (!model) {
      const message = `No model ${table}`;
      throw {
        message
      }
    }

    //createFieldMap(model);

    const idField = model.fields.filter(f => f.isId)[0];
    const sqlStr = `delete from ${table} where ${idField.field}=${vmap(id)}`;

    console.log(sqlStr);
    const rows = await db.doQuery(sqlStr);
    return res.json(rows);
  } catch (err: any) {
    console.log(err);
    res.send(500, {
      message: err.message,
      errors: err.errors
    });
  }
}

export async function getDatabases(req: Request, res: Response) {
  const dbs = await db.getAllDatabases();
  return res.json(dbs);
}

export async function getTables(req: Request, res: Response) {
  const dbs = await db.getAllTables();
  return res.json(dbs);
}

export async function importPayment(req: Request, res: Response) {
  const { date, amount, name, notes, source } = req.body;
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.json({
      error: `Date mismatch ${date}`,
    })
  }

  const parms = [date, amount, name, notes || '', source || ''];
  const existing = await db.doQuery(`select 1 from importPayments where date=? and amount=? and name=? and notes=? and source=?`,
    parms);
  if (existing.length) {
    return res.json({
      imported: 0,
    });
  } else {

    await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source) values(?,?,?,?,?,?)`,
      [uuid.v1()].concat(parms))
    return res.json({
      imported: 1,
    })
  }
}

export async function getTableInfo(req: Request, res: Response) {
  const table = req.query.table;
  const fields = await db.getTableFields(table);
  const indexes = await db.getTableIndexes(table);
  const constraints = await db.getTableConstraints(table);
  res.json({
    fields,
    indexes,
    constraints,
  })
}

export async function freeFormSql(req: Request, res: Response) {
  try {
    const sqlStr = req.body.sql;
    const parms = req.body.parms;
    console.log(sqlStr);
    const rows = await db.doQuery(sqlStr, parms);
    return res.json(rows);
  } catch (err: any) {
    console.log(err);
    res.send(500, {
      message: err.message,
      errors: err.errors
    });
  }
}
