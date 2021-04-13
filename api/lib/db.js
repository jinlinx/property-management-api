const mysql=require('./mysql');
const {
    conn,
    doQuery,
    doQueryOneRow,
}=mysql.createConn();

async function findUser(qryPrms) {
    let query='';
    let prm=[];
    const prmNames=['id','email','username'];
    const add=(op, name,val) => {
        if(val===undefined) {
            return;
        };
        if(query) query=`${query} ${op}`;
        prm.push(val);
        query=`${query} ${name}=?`;
    };
    prmNames.forEach(n => add('or',n,qryPrms[n]));
    return await doQuery(`select * from user where ${query}`, prm).then(res => {
        return res && res[0];
    })
}

async function getAllDatabases() {    
    const dbs = await doQuery('show databases');
    const mapped = dbs.map(d => d.Database);
    return mapped;
}

async function getAllTables() {
    const tables = await doQuery('show tables');
    if (!tables.length) return [];
    const first = tables[0];
    const key = Object.keys(first)[0];
    const mapped = tables.map(d => d[key]);    
    return mapped;
}

async function getTableFields(table) {
    const fields = await doQuery(`desc ${table}`);      
    const mapped = fields.map(f => ({
        fieldName: f.Field,
        fieldType: f.Type,
        allowNull: f.Null === 'YES',
        defVal: f.Default,
    }));
    console.log(mapped);
    return mapped;
}

async function getTableIndexes(table) {
    const sqlStr = `SHOW INDEXES FROM ${table};`
    const idxes = await doQuery(sqlStr);
    const mapped = idxes.map(idx => ({
        table: idx.Table,
        unique: !idx.Non_unique,
        indexName: idx.Key_name,
        columnName: idx.Column_name,
        allowNull: idx.Null,
    }));
    console.log(mapped);
    return mapped;
}
async function getTableConstraints(table) {
    const constraints = await doQuery(`select COLUMN_NAME columnName, CONSTRAINT_NAME constraintName,
     REFERENCED_COLUMN_NAME refColumn, REFERENCED_TABLE_NAME refTable
    from information_schema.KEY_COLUMN_USAGE
    where TABLE_NAME ='${table}';`);
    console.log(constraints);
    return constraints;
}

module.exports = {
    end: ()=>conn.end(),
    conn,
    doQuery,
    doQueryOneRow,
    findUser,
    getAllDatabases,
    getAllTables,
    getTableFields,
    getTableIndexes,
    getTableConstraints,
}
