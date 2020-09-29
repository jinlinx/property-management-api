//const tenantInfo = require('./tenantInfo');
const fs = require('fs');
const files = fs.readdirSync(__dirname).filter(n => n !== 'index.js');

const data = files.reduce((acc, fname) => {
    const modName = fname.split('.')[0];
    acc[modName] = require(`./${modName}`);
    return acc;   
}, {});

module.exports = data;