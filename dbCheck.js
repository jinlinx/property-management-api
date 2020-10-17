const mysql = require('./api/lib/mysql');

const mod = require('./api/models/index');
const { extensionFields } = require('./api/util/util');

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

const typeToType=type => {
    if ( type==='uuid' ) return 'varchar(100)';
    if ( type==='date' ) return 'date';
    if ( type==='datetime' ) return 'datetime';
    if ( type==='decimal' ) return 'DECIMAL(12,2)';
    return 'varchar(100)';
}
async function check() {
    await Promise.map( tables, async tabName => {
        const columnQry=() => doQuery( `SHOW COLUMNS FROM ${tabName}` );
        const curMod=mod[ tabName ];
        if ( !curMod ) {
            throwErr( `Table ${tabName} not in DB` );
        }
        try {
            await columnQry()
        } catch ( exc ) {
            console.log( exc.message );            
            const createSql=`create table ${tabName} (${curMod.fields.map( f => {
                return `${f.field} ${typeToType( f.type )}`
            } ).join( ',' )})`;
            console.log( createSql );
            await doQuery( createSql );
        }
        const res=await columnQry();

        const dbIds = res.reduce((acc, dbf) => {
            acc[dbf.Field] = dbf;
            return acc;
        }, {});
        curMod.fields.forEach(myf => {
            if (!dbIds[myf.field]) {
                console.log( `Table ${tabName} field ${myf.field} not in DB` );
            }
        });
        console.log(`${tabName} good`);
        
        const mustExistDateCols=[
            { field: 'created', type: 'datetime', def: 'NOW()' }, { field: 'modified', type: 'datetime', def: 'NOW()' }
        ].concat( curMod.fields );
        await Promise.map(mustExistDateCols, async col => {
            if ( !dbIds[ col.field ] ) {
                await doQuery(`alter table ${tabName} add column ${col.field} ${typeToType(col.type)} ${col.def? ' default '+col.def:''};`);
                console.log( `alter ${tabName} added ${col.field}` );
            }
        }, {concurrency: 1});

        const curView = curMod.view
        if (curView) {
            const select = 'select ' + curMod.fields.concat(extensionFields).map(f => `${tabName}.${f.field}`)
                .concat(curView.fields.map(f=>`${f.table}.${f.name} ${f.field}`))
                .join(',');
            const innerJoin = curMod.fields.map(f => {
                const fk = f.foreignKey;
                if (fk) {
                    return (` left outer join ${fk.table} on ${tabName}.${f.field}=${fk.table}.${fk.field} `);
                }
            }).join(' ');
            const createViewSql = `create or replace view ${curView.name} as ${select} from ${tabName} ${innerJoin}`;
            console.log(createViewSql);
            try {
                await doQuery(createViewSql);
            } catch (err) {
                console.log(`${createViewSql} ${err.message}`);
            }
        }

    }, { concurrency: 1 });
    
    
    conn.end();
}

module.exports = {
    check,
}