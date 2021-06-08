const paypal = require('../../statementpuller/paypal');
const venmo = require('../../statementpuller/venmo');
const caspapp = require('../../statementpuller/cashapp');
const webHandler = require('../../statementpuller/webhandler');
const importPropertyMaintenance = require('../gimports/importPropertyMaintence');
const submit = require('../../statementpuller/lib/submit');
const db = require('../lib/db');
const uuid = require('uuid');
const { get, sum, sumBy } = require('lodash');
const importMatchPayments = require('../gimports/importMatchPayments');
const importTenant = require('../gimports/import');
const importPayments = require('../gimports/importPayments');
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
        else if (who === 'importMatchPayments') 
            return importMatchPayments.importAndMatchPayments();
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
        console.log(`got ids ${req.body.ids} ${req.body.paymentTypeID}`)
        const match = await submit.matchImports(req.body.ids, req.body.paymentTypeID);
        res.send(match)
    } catch (err) {
        console.log(err);
        res.send(500, err);
    }
}
async function doGsImport(req, res) {
    const date = new Date();
    console.log(`doGsImport ${date}`);
    
    if (req.query.who === 'maintence') {
        const pres = await importPropertyMaintenance.importPropertyMaintenance();
        return res.send({ message: `added ${sumBy(pres, 'count')} errors ${pres.filter(x=>x.err).map(e=>e.err).join(',')}` });
    } else if (req.query.who === 'payment') {
        const pres = await importPayments.importPayments();
        return res.send({ message: `added ${sum(pres)}` });
    } else {
        return await importTenant.importTenantDataGS();
    }
}

async function sendPaymentNotification(req, res) {
    try {
        console.log('sendPaymentNotification')
        const res = await submit.sendReadyToImportPaymentEmail();
        res.send(res)
    } catch (err) {
        console.log(err);
        res.send(500, err);
    }
}


module.exports = {   
    doStatement,
    doGsImport,
    matchPayments,
    getStatementProcessingMsg,
    sendPaymentNotification,
};