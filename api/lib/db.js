const mysql=require('./mysql');
const {
    conn,
    doQuery,
}=mysql.createConn();

async function findUser(qryPrms) {
    let query='';
    let prm=[];
    const prmNames=['uuid','email','userName'];
    const add=(op, name,val) => {
        if(val===undefined) {
            return;
        };
        if(query) query=`${query} ${op}`;
        prm.push(val);
        query=`${query} ${name}=?`;
    };
    prmNames.forEach(n => add('or',n,qryPrms[n]));
    return await doQuery(`select * from users where ${query}`,prm);
}
module.exports={
    conn,
    doQuery,
    findUser,
}