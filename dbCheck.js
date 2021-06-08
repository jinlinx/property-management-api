const mysql = require('./api/lib/mysql');

const mod = require('./api/models/index');
const { extensionFields } = require('./api/util/util');

const Promise = require('bluebird');
const { coroutine } = require('bluebird');

const {
    conn,
    doQuery,
} = mysql.createConn();

const tables = Object.keys(mod);

function throwErr(message) {
    console.log(message);
    throw { message };
}

const typeToType=(type,size) => {
    if ( type==='uuid' ) return 'varchar(100)';
    if ( type==='date' ) return 'date';
    if ( type==='datetime' ) return 'datetime';
    if (type === 'decimal') return 'DECIMAL(12,2)';
    if (size) return `varchar(${size})`;
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
                return `${f.field} ${typeToType( f.type, f.size )}`
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
            const dbField = dbIds[col.field];
            if (!dbField) {
                const alterTblSql = `alter table ${tabName} add column ${col.field} ${typeToType(col.type)} ${col.def ? ' default ' + col.def : ''};`;
                try {
                    await doQuery(alterTblSql);
                    console.log(`alter ${tabName} added ${col.field}`);
                } catch (err) {
                    console.log(`alter table failed ${alterTblSql} ${err.message}`);
                    throw err;
                }
            } else {
                const dbType = dbIds[col.field].Type.toLowerCase();
                const myType = typeToType(col.type, col.size).toLowerCase();
                if (dbType !== myType) {                    
                    const alterTblSql = `alter table ${tabName} modify column ${col.field} ${myType} ${col.def ? ' default ' + col.def : ''};`;
                    console.log(`type diff ${dbType} mytype=${myType}: ${alterTblSql}`);
                    await doQuery(alterTblSql);
                }                
            }            
        }, { concurrency: 1 });
        
        await Promise.map(res, async dbf => {
            const found = mustExistDateCols.filter(c => c.field == dbf.Field);
            if (!found.length) {                
                const alterTblSql = `alter table ${tabName} drop column ${dbf.Field}`;
                console.log(`Warning, going to drop db col ${dbf.Field} ${alterTblSql}`);
                await doQuery(alterTblSql);
            }
        }, { concurrency: 1 });

        const curView = curMod.view
        if (curView) {
            const select = 'select ' + curMod.fields.concat(extensionFields).map(f => `${tabName}.${f.field}`)
                .concat(curView.fields.map(f=>`${f.table}.${f.field || f.name} ${f.name || ''}`))
                .join(',');
            const innerJoin = curMod.fields.map(f => {
                const fk = f.foreignKey;
                if (fk) {
                    return (` left outer join ${fk.table} on ${tabName}.${f.field}=${fk.table}.${fk.field} `);
                }
            }).join(' ');
            const createViewSql = `create or replace view ${curView.name} as ${select} from ${tabName} ${innerJoin} ${curMod.view.extraViewJoins||''}`;
            console.log(createViewSql);
            try {
                await doQuery(createViewSql);
            } catch (err) {
                console.log(`${createViewSql} ${err.message}`);
                throw err.message
            }
        }

    }, { concurrency: 1 });
    
    
    conn.end();
}

module.exports = {
    check,
}