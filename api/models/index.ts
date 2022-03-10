//const tenantInfo = require('./tenantInfo');
const fs = require('fs');
const keyBy = require('lodash/keyBy');
const files = fs.readdirSync(__dirname).filter((n:string) => n !== 'index.js' && (n.endsWith('.js') || n.endsWith('.ts'))) as string[];

export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
  field: string; //actual field
  name?: string; //name
  desc: string;
  type: string;
  size?: string;
  required?: boolean;
  isId?: boolean;
  def?: string; 
  unique?: boolean;
  //key?: 'UNI' | 'PRI' | null;
  formatter?: (v: PossibleDbTypes) => string;
  autoValueFunc?: (row: { [key: string]: (string | number) }, field: IDBFieldDef, val: PossibleDbTypes)=>(string);
  foreignKey?: {
    table: string;
    field: string;
  };
}

export interface IDBViewFieldDef extends IDBFieldDef {  
  table: string; //for views only  
}

export interface IDBModel {
  fields: IDBFieldDef[];
  fieldMap?: {
    [key: string]: IDBFieldDef;
  };
  view: {
    name: string;
    fields: IDBViewFieldDef[];
    extraViewJoins?: string;
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

export default data;