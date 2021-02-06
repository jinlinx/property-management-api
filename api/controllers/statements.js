const paypal = require('../../statementpuller/paypal');
const venmo = require('../../statementpuller/venmo');
const caspapp = require('../../statementpuller/cashapp');
const webHandler = require('../../statementpuller/webhandler');
const importPropertyMaintenance = require('../gimports/importPropertyMaintence');
const submit = require('../../statementpuller/lib/submit');
const db = require('../lib/db');
const uuid = require('uuid');
const get = require('lodash/get');
const sum = require('lodash/sum');
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
        else if (who === 'cashapp')
            return caspapp.doCashApp;
        else throw new Error('Must be paypal or venmo')
    }
    
    const id = uuid.v1();
    try {
        const action = getAction(req.query.who);
        console.log(`insert ${req.query.who} starting`);
        await db.doQuery(`insert into importLog(id, source, start, msg) values(?,?,now(),?)`,
            [id, req.query.who, 'started']);
        console.log(`insert ${req.query.who} action`);
        const pres = await action({
            log: msg => {
                //console.log(msg);
                webHandler.sendStatus(msg);
                pullStatementState.message = msg;
            },
            getCode: () => {
                return webHandler.askCode('Please input code');
            },
        });
        const newItems = get(pres, 'matched.length'); 
        console.log(`insert ${req.query.who} done`);
        await db.doQuery(`update importLog set end=now(),msg=? where id=?`,
            [`done ${newItems}`,id]);
        return res.send(pres);
    } catch (err) {
        console.log(err);
        await db.doQuery(`update importLog set end=now(),msg=? where id=?`,
            [err.message, id]);        
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
    
    const pres = await importPropertyMaintenance.importPropertyMaintenance();
    return res.send({ message: `added ${sum(pres)}` });
}


module.exports = {   
    doStatement,
    doGsImport,
    matchPayments,
    getStatementProcessingMsg,
};