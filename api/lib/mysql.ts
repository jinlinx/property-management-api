import * as  mysql from 'mysql';

export function createConn(config?: mysql.PoolConfig) {
    const conn = mysql.createPool(config || {
        connectionLimit: 3,
        //host: 'localhost',
        //user: 'lluser',
        host: process.env.DBHOST || 'localhost',
        user: 'jjuser',
        password: '12345',
        database: "PM",
        charset: "utf8mb4_unicode_ci",
    });

    function doQuery(sql: string, param:any[] = []): Promise<any[]> {
        return new Promise((resolve,reject) => {
                conn.query(sql, param, (err,result) => {
                    if(err) return reject(err);
                    resolve(result);
                });
        });
    }

    async function doQueryOneRow(sql: string, parm: any[]) {
        const rows = await doQuery(sql, parm);
        return rows[0];
    }

    return {
        end: ()=>conn.end(),
        conn,
        doQuery,
        doQueryOneRow,
    }
}
