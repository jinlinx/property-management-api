//const tenantInfo = require('./tenantInfo');
const fs = require('fs');
const keyBy = require('lodash/keyBy');
const files = fs.readdirSync(__dirname).filter(n => n !== 'index.js');


function createFieldMap(model) {
    if(!model.fieldMap) {    
      model.fieldMap = keyBy(model.fields, 'field');
    }
  }

  
const data = files.reduce((acc, fname) => {
    const modName = fname.split('.')[0];
    const model = require(`./${modName}`);
    createFieldMap(model);
    acc[modName] = model;
    return acc;   
}, {});

module.exports = data;