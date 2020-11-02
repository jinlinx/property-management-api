const mysql=require('mysql');

function createConn(config) {
    const conn = mysql.createPool(config || {
        connectionLimit: 3,
        //host: 'localhost',
        //user: 'lluser',
        host: process.env.DBHOST || 'localhost',
        user: 'jjuser',
        password: '12345',
        database: "PM"
    });

    function doQuery(sql, param = []) {
        return new Promise((resolve,reject) => {
                conn.query(sql, param, (err,result) => {
                    if(err) return reject(err);
                    resolve(result);
                });
        });
    }

    async function doQueryOneRow(sql, parm) {
        const rows = await doQuery(sql, parm);
        return rows[0];
    }

    return {
        conn,
        doQuery,
        doQueryOneRow,
    }
}

module.exports={
    createConn,
};