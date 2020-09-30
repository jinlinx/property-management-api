const mysql = require('./api/lib/mysql');

const mod = require('./api/models/index');
const Promise = require('bluebird');

const {
    conn,
    doQuery,
} = mysql.createConn();

const tables = Object.keys(mod);

function throwErr(message) {
    console.log(message);
    throw { message };
}
async function check() {
    await Promise.map(tables, async tabName => {
        const res = await doQuery(`SHOW COLUMNS FROM ${tabName}`);
        const curMod = mod[tabName];
        if (!curMod) {
            throwErr(`Table ${tabName} not in DB`);
        }
        const dbIds = res.reduce((acc, dbf) => {
            acc[dbf.Field] = dbf;
            return acc;
        }, {});
        curMod.fields.forEach(myf => {
            if (!dbIds[myf.field]) {
                throwErr(`Table ${tabName} field ${myf.field} not in DB`);
            }
        });
        console.log(`${tabName} good`);
        
        const mustExistDateCols = ['created', 'modified'];
        await Promise.map(mustExistDateCols, async col => {
            if (!dbIds[col]) {
                await doQuery(`alter table ${tabName} add column ${col} datetime;`);
                console.log(`alter ${tabName} added ${col}`);
            }
        }, {concurrency: 1});

    }, { concurrency: 1 });
    
    
    conn.end();
}

module.exports = {
    check,
}