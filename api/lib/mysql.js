const mysql=require('mysql');

function createConn(config) {
    const conn = mysql.createPool(config || {
        connectionLimit: 3,
        host: '192.168.1.115',
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

    return {
        conn,
        doQuery,
    }
}

module.exports={
    createConn,
};