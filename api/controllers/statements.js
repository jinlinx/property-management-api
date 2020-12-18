const paypal = require('../../statementpuller/paypal');
const venmo = require('../../statementpuller/venmo');
const gsimport = require('../gimports/import');
const submit = require('../../statementpuller/lib/submit');
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
    
    try {
        const action = getAction(req.query.who);
        const pres = await action()
        return res.send(pres);
    } catch (err) {
        console.log(err);
        return res.send(500, err);
    }
    
    return res.send('bad');
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
};