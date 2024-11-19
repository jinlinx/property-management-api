import { Request, Response } from 'restify'
import * as db from '../lib/db';
import * as  models from '../models/index';
import { keyBy, get } from 'lodash';
import * as uuid from 'uuid';
import { extensionFields } from '../util/util';
import moment from 'moment';
import {getUserAuth, IUserAuth } from '../util/pauth'

import { OWNER_SEC_FIELD, OWNER_PARENT_SEC_FIELD } from '../models/types';

function removeBadChars(str: string) {
  return str.replace(/[^A-Za-z0-9]/g, '');
}

export async function doQuery(req: Request, res: Response) {
  ///TODO: limit with security
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
  'in':true,
}) as { [key: string]: boolean; };

const goodGroupOps = Object.freeze({
  'sum': true
}) as { [key: string]: boolean; };

interface ISqlRequestFieldDef {
  field: string;
  op: '>' | '>=' | '=' | '<' | '<=' | '!=' | '<>' | 'in' | 'sum' | 'count';
  name: string;
}
interface ISqlOrderDef {
  name: string;
  op: 'asc' | 'desc';
}

interface ISqlRequestWhereItem {
  field: string;
  op: string;
  val: string | number | (string|number)[];
}

interface ISqlRequest {
  table: string;
  fields: (ISqlRequestFieldDef | string)[];
  joins?: any;
  order?: ISqlOrderDef[];
  whereArray?: ISqlRequestWhereItem[];
  groupByArray?: {
    field: string;
  }[];
  offset?: number | string;
  rowCount?: number | string;
}

type IPrmType = models.PossibleDbTypes ;
interface IInternalWherePrm 
{
  whr: string[];
  prms: IPrmType[];
}

function cleanId(num: any): number {
  return parseInt(num);
}
function getSecAuthWhereCond(fields: models.IDBFieldDef[], auth: IUserAuth) {  
  const res = fields.reduce((acc, f) => {
    if (f.isOwnerSecurityField) {
      const goodIds = auth.pmInfo.ownerPCodes.map(cleanId).join(',');
      //OWNER_SEC_FIELD
      const cond = ` ${f.field} in (${goodIds})`;
      acc.cond = cond;
      //cond = `(${cond} or ${OWNER_PARENT_SEC_FIELD} =${auth.code} )`;       
    } else if (f.isOwnerSecurityParentField) {
      //acc.parentCond = `${OWNER_PARENT_SEC_FIELD} =${auth.code} )`;       
      acc.parentCond = `${f.field}=${cleanId(auth.code)}`;
    }    
    return acc;
  }, {
    cond: '',
    parentCond: ''
  });  
  return !res.parentCond? res.cond : ` (${res.cond} OR ${res.parentCond})`;
}
export async function doSqlGetInternal(auth: IUserAuth, sqlReq: ISqlRequest) {
  //joins:{ table:{col:als}}
  const { table, fields, joins, order,
    whereArray,    //field, op, val
    groupByArray,  //field [{"field":"workerID"}, {"op":"sum", "field":"amount"}]
    offset = 0, rowCount = 2147483647
  } = sqlReq;
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
  let wherePrm = [] as IPrmType[];
  //if (whereArray)
  {
    const whereRed = (whereArray || []).reduce((acc, w) => {
      const pushNop = () => {
        acc.whr.push('1=?');
        acc.prms.push('1');
      };
      if (fieldMap[w.field]) {
        if (goodOps[w.op]) {
          if (w.op === 'in') {
            if (Array.isArray(w.val)) {
              acc.whr.push(`${w.field} in(${Array(w.val.length).fill('?').join(',')})`);
              w.val.forEach(v => acc.prms.push(v));
            } else {
              acc.whr.push(`${w.field} in(?)`);
              acc.prms.push(w.val);
            }
          } else {
            acc.whr.push(`${w.field} ${w.op} ?`);
            if (!Array.isArray(w.val)) {
              acc.prms.push(w.val);
            } else {
              const error = `File can't be array ${table}.${w.field}`;
              throw {
                error,
                message: error,
              }
            }
          }
        } else {
          console.log(`Warning bad op ${w.field} ${w.op}`);
          //pushNop();
        }
      } else {
        console.log(`Warning field not mapped ${w.field}`);
        //pushNop();
      }
      return acc;
    }, {
      whr: [],
      prms: [],
    } as IInternalWherePrm);

    if (fieldMap[OWNER_SEC_FIELD+'dontuseanymore'])
    {
      const goodIds = auth.pmInfo.ownerPCodes.map(x => '?').join(',');
      let cond = ` ${OWNER_SEC_FIELD} in (${goodIds})`;
      auth.pmInfo.ownerPCodes.forEach(c => whereRed.prms.push(c));
      if (fieldMap[OWNER_PARENT_SEC_FIELD]) {
        cond = `(${cond} or ${OWNER_PARENT_SEC_FIELD} =? )`;
        whereRed.prms.push(auth.code);
      }
      whereRed.whr.push(cond);      
    }
    const secCond = getSecAuthWhereCond(model.fields, auth);
    if (secCond) whereRed.whr.push(secCond);
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
  console.log([sqlStr]);
  console.log(wherePrm);
  const countRes = await db.doQueryOneRow(`select count(1) cnt ${fromAndWhere}  ${groupByStr}`, wherePrm);
  const rows = await db.doQuery(sqlStr, wherePrm);

  return ({
    offset,
    rowCount,
    total: get(countRes, 'cnt'),
    rows,
  });
}

export async function doGet(req: Request, res: Response) {
  const auth = getUserAuth(req);
  if (!auth) {
    const message = 'not authorized';
    return res.json({
      message,
      error: message,
    })
  }
  try {
    const rspRes = await doSqlGetInternal(auth, req.body as ISqlRequest);
    //joins:{ table:{col:als}}
    
    return res.json(rspRes);
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

interface ICreateUpdateParms {
  table: string;
  fields: { [key: string]: string };
  create: boolean;
}
export async function createOrUpdateInternal(body: ICreateUpdateParms, auth: IUserAuth) {
  const { table, create } = body;
  const fields = body.fields;
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

    sqlStr = `insert into ${table} (${model.fields.filter(f => !f.ident).map(f => f.field).join(',')},created,modified)
       values (${model.fields.filter(f => !f.ident).map((f) => {
      let val = fields[f.field] as models.PossibleDbTypes;
      if (f.isId) {
        idVal = uuid.v1();
        val = idVal;
      }
      if (f.specialCreateVal) {
        sqlArgs.push(f.specialCreateVal(auth));
        return '?';
         }
         
         if (f.isOwnerSecurityField) {
           const vi = parseInt(val as string);
           if (vi !== auth.code && !auth.pmInfo.ownerPCodes.includes(vi)) {
             const error = `Code ${vi} (${val} from fiel ${f.field} isId=${f.isId}) is not authorized`;
             throw {
               message: error,
               error,
             }
           }
         }
      //if (f.field === OWNER_SEC_FIELD) {
      //  sqlArgs.push(auth.code);
      //  return '?';
      //}
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
    //update
    interface INameVal {
      name: string;
      value: models.PossibleDbTypes;
    }
    const { idField, values } = model.fields.reduce((acc, mf) => {
      if (mf.isId) {
        acc.idField = { name: mf.field, value: fields[mf.field] };
      } else if (!mf.dontUpdate){
        if (mf.specialCreateVal) {
          acc.values.push({
            name: mf.field,
            value: mf.specialCreateVal(auth),
          })
        } else {
          const v = fields[mf.field];
          if (v !== undefined) {
            let formatter = mf.formatter || vmap2;
            if (mf.type === 'datetime') {
              formatter = dateStrFormatter as any;
            }
            if (mf.autoValueFunc) {
              const fv = mf.autoValueFunc(fields, mf, v as string); //just fake it;
              formatter = () => fv;
            }
            acc.values.push({
              name: mf.field,
              value: formatter(v, mf),
            })
          }
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
    const setValMap = (v: INameVal) => `${v.name}=?`;
    const whereCond = [`${idField.name}=${vmap(idField.value)}`];
    const secCond = getSecAuthWhereCond(model.fields, auth);
    if (secCond) whereCond.push(secCond);
    sqlStr = `update ${table} set ${values.map(v => setValMap(v)).join(',')},modified=NOW() where ${whereCond.join(' and ')}`;
    sqlArgs = values.map(v => v.value);
  }

  console.log(sqlStr);
  console.log(sqlArgs);
  const rows = await db.doQuery(sqlStr, sqlArgs) as any;

  rows.id = idVal;
  return rows;
}

export async function createOrUpdate(req: Request, res: Response) {
  try {
    const auth = getUserAuth(req);
    if (!auth) {
      const message = 'not authorized';
      return res.json({
        message,
        error: message,
      })
    }
    const rows = await createOrUpdateInternal(req.body, auth);    
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
