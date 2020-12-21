const paypal = require('../../statementpuller/paypal');
const venmo = require('../../statementpuller/venmo');
const webHandler = require('../../statementpuller/webhandler');
const gsimport = require('../gimports/import');
const submit = require('../../statementpuller/lib/submit');
const db = require('../lib/db');
const uuid = require('uuid');
const get = require('lodash/get');
const pullStatementState = {
    message: '',
}
async function doStatement(req, res) {
    const date = new Date();
    console.log(`statement ${date}`);
    const getAction = who => {
        if (who === 'paypal')
            return paypal.doPaypal;
        else if (who === 'venmo')
            return venmo.doVenmo;
        else throw new Error('Must be paypal or venmo')
    }
    
    const id = uuid.v1();
    try {
        const action = getAction(req.query.who);        
        await db.doQuery(`insert into importLog(id, source, start, msg) values(?,?,now(),?)`,
            [id, req.query.who, 'started']);
        const pres = await action({
            log: msg => {
                //console.log(msg);
                webHandler.sendStatus(msg);
                pullStatementState.message = msg;
            }
        });
        const newItems = get(pres, 'matched.length');
        await db.doQuery(`update importLog set end=now(),msg=? where id=?`,
            [`done ${newItems}`,id]);
        return res.send(pres);
    } catch (err) {
        await db.doQuery(`update importLog set end=now(),msg=? where id=?`,
            [err.message, id]);
        console.log(err);
        return res.send(500, err);
    }    
    return res.send('bad');
}

function getStatementProcessingMsg(req, res) {
    return res.send({
        message: pullStatementState.message,
    })
}

async function matchPayments(req, res) {
    try {
        const match = await submit.matchImports();
        res.send(match)
    } catch (err) {
        console.log(err);
        res.send(500, err);
    }
}
async function doGsImport(req, res) {
    const date = new Date();
    console.log(`doGsImport ${date}`);
    
    const pres = await gsimport.importTenantDataGS();
    return res.send(pres);
}


module.exports = {   
    doStatement,
    doGsImport,
    matchPayments,
    getStatementProcessingMsg,
};