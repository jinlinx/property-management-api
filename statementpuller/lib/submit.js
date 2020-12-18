//const request = require('superagent');
const db = require('../../api/lib/db');
const Promise = require('bluebird');
const uuid = require('uuid');
const sheet = require('./getSheet').createSheet();
const moment = require('moment');
const sheetId = '1xFCW8QsdfWRMjzXcUcXwe4HIfWNShgkrHE7UbKGgwLc';
async function submit(datas) {
    let cur = 0;
    await sheet.appendSheet(sheetId, `'Sheet1'!A1`, datas.map(data => [data.date, data.amount, data.name, data.notes, data.source]));
    const nameSourceLeaseRows = await db.doQuery(`select ptm.tenantID, ptm.name, ptm.source , lti.leaseID,
    t.firstName, t.lastName    
    from payerTenantMapping ptm
    inner join tenantInfo t on ptm.tenantID = t.tenantID
    inner join leaseTenantInfo lti on ptm.tenantID = lti.tenantID
    where
    ${datas.map(d => '(ptm.name=? and ptm.source=?)').join(' or ')}`, datas.reduce((acc, d) => { 
        acc.push(d.name);
        acc.push(d.source);
        return acc;
    }, []));
    const getMapKey = r => `${r.name}-${r.source}`;
    const nameSoruceLeaseMapping = nameSourceLeaseRows.reduce((acc, r) => {
        acc[getMapKey(r)] = r;
        return acc;
    }, {});
    const allRes = await Promise.map(datas, async data => {
        const me = cur++;
        console.log(`processing ${me}/${datas.length}`);        
        // return await request.post(`http://${host ||'192.168.1.41:8081'}/sql/importPayment`).send(
        //     {
        //         date: data.date,
        //         amount: data.amount,
        //         name: data.name,
        //         notes: data.notes,
        //         source: data.source,
        //     }
        // ).then(res => {
        //     console.log(res.body);            
        //     console.log(`done ${me}/${datas.length}`);
        //     return res.body;
        // });
        const { date, amount, name, notes, source } = data;
        const parms = [date, amount, name, notes || '', source || ''];
        const existing = await db.doQuery(`select 1 from importPayments where date=? and amount=? and name=? and notes=? and source=?`,
            parms);
        if (existing.length) {
            return ({
                ...data,
                imported: 0,
            });
        } else {

            const id = uuid.v1();
            const key = getMapKey(data);
            const matched = nameSoruceLeaseMapping[key];
            let imported = 'imported';
            if (matched) {
                imported = 'imported and matched';
                console.log(`matched ${name} on ${matched.firstName} ${matched.lastName} for ${amount} ${matched.leaseID}`);                
                await db.doQuery(`insert into rentPaymentInfo(paymentID, receivedDate,receivedAmount,
                        paidBy,leaseID,created,modified,notes)
                        values(?,?,?,
                        ?,?,now(),now(),?)`, [id, moment(date).toDate(), amount,
                    name, matched.leaseID, notes]);                                
                await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source, matchedTo) values(?,?,?,?,?,?,?)`,
                    [id].concat(parms).concat(id))
            } else {
                await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source) values(?,?,?,?,?,?)`,
                    [id].concat(parms));
            }
            return ({
                ...data,
                id,
                imported,
            })
        }
    }, { concurrency: 5 });
    const imported = allRes.filter(r => r.imported);
    console.log(`imported=${imported.length}, all itemps ${allRes.length} `);
    return allRes;
}


//submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));

module.exports = {
    submit,
}