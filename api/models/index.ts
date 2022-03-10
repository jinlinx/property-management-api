//const tenantInfo = require('./tenantInfo');
const fs = require('fs');
const keyBy = require('lodash/keyBy');
const files = fs.readdirSync(__dirname).filter((n:string) => n !== 'index.js') as string[];

export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
  field: string; //actual field
  name?: string; //name
  desc: string;
  type: string;
  required: boolean;
  isId: boolean;
  formatter: (v: PossibleDbTypes) => string;
  autoValueFunc: (row: { [key: string]: (string | number) }, field: IDBFieldDef, val: PossibleDbTypes)=>(string);
  foreignKey: {
    table: string;
    field: string;
  };
}

export interface IDBModel {
  fields: IDBFieldDef[];
  fieldMap?: {
    [key: string]: IDBFieldDef;
  };
  view: {
    name: string;
    fields: IDBFieldDef[];
  }
}
function createFieldMap(model: IDBModel) {
    if(!model.fieldMap) {    
      model.fieldMap = keyBy(model.fields, 'field');
    }
  }

  
export const data = files.reduce((acc, fname) => {
    const modName = fname.split('.')[0];
  const model = require(`./${modName}`) as IDBModel;
    createFieldMap(model);
    acc[modName] = model;
    return acc;   
}, {} as { [key: string]: IDBModel});

//module.exports = data;