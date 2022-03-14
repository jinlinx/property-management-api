//const tenantInfo = require('./tenantInfo');
import {readdirSync}  from 'fs';
import { keyBy } from 'lodash'
import { OWNER_SEC_FIELD, IUserAuth } from './types'

const files = readdirSync(__dirname).filter((n:string) => n !== 'index.js' && n !== 'types.js' && (n.endsWith('.js'))) as string[];

import { PossibleDbTypes, IDBFieldDef, IDBViewFieldDef, IDBModel } from './types'

export { PossibleDbTypes, IDBFieldDef, IDBViewFieldDef, IDBModel };

function createFieldMap(model: IDBModel) {
    if(!model.fieldMap) {    
      model.fieldMap = keyBy(model.fields, 'field');
    }
  }

  
export const data = files.reduce((acc, fname) => {
  const modName = fname.split('.')[0];
  const model = require(`./${modName}`) as IDBModel;
  if (!model.fields) {
    const modelNames = Object.keys(model);
    modelNames.forEach(name => {
      const act = (model as any)[name] as IDBModel;
      act.fields.forEach(f => {
        if (f.ident) {
          f.dontUpdate = true;
        }
        if (f.field === OWNER_SEC_FIELD) {
          f.dontUpdate = true;
        } else
        if (f.field === 'parentID') {
          f.dontUpdate = true;
          f.specialCreateVal = (auth: IUserAuth) => auth.code;
        }
      })
      createFieldMap(act);
      acc[name] = act;  
    })
  } else {
    createFieldMap(model);
    acc[modName] = model;
  }
  return acc;
}, {} as { [key: string]: IDBModel});

//module.exports = data;

export default data;