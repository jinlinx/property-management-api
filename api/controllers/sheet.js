const gsheet = require('../lib/googleApiReq');
const { get } = require('lodash');
async function doGet(req, res) {
    try {
        const { name ='read', op, id, range } = req.params;        
        const data = req.body;
        
        const client = await gsheet.getClient(name);
        if (!client) {
            const message = `clinet ${name} not found`;
            console.log(message);
            return res.send(500, {
                message,
            });
        }
        const sheet = client.getSheeOps(id);
        let rsp = null;
        if (op === 'read') {
            rsp = await sheet.read(range);
        } else if (op === 'append') {
            rsp = await sheet.append(range, data); //`'Sheet1'!A1:B2`, [['data']]
        } else if (op === 'batch') {
            rsp = await sheet.doBatchUpdate(data);
        } else {
            res.send(400, { message: `Not supported operation ${op}` });
        }
        return res.json(rsp);
    } catch (err) {
        const rspErr = get(err, 'response.text');
        console.log(rspErr || err);
        console.log(req.params)
        res.send(500, {
            message: err.message,
            errors: err.errors
        });
    }
}

module.exports = {
    doGet,
}