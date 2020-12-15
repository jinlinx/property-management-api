const paypal = require('../../statementpuller/paypal');
async function doStatement(req, res) {    
    const date = new Date();
    console.log(`statement ${date}`);
    if (req.query.who === 'paypal') {
        const pres = await paypal.doPaypal()
        return res.send(pres);
    }
    return res.send('bad');
}

module.exports = {   
    doStatement,
};