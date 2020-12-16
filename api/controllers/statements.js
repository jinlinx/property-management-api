const paypal = require('../../statementpuller/paypal');
const gsimport = require('../gimports/import');
async function doStatement(req, res) {    
    const date = new Date();
    console.log(`statement ${date}`);
    if (req.query.who === 'paypal') {
        const pres = await paypal.doPaypal()
        return res.send(pres);
    }
    return res.send('bad');
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
};