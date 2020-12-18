//const request = require('superagent');
const db = require('../../api/lib/db');
const Promise = require('bluebird');
const uuid = require('uuid');
const sheet = require('./getSheet').createSheet();
const moment = require('moment');
const sheetId = '1sKppFHJy_MRRgHuV2PzhliSzuje7O0Rb-ntiOrLDVPA';
async function submit(datas) {
    let cur = 0;
    //await sheet.appendSheet(sheetId, `'Sheet1'!A1`, datas.map(data => [data.date, data.amount, data.name, data.notes, data.source]));
    const nameSourceLeaseRows = await db.doQuery(`select ptm.tenantID, ptm.name, ptm.source , lti.leaseID,
    t.firstName, t.lastName, h.address, h.city, h.state, h.zip
    from payerTenantMapping ptm
    inner join tenantInfo t on ptm.tenantID = t.tenantID    
    inner join leaseTenantInfo lti on ptm.tenantID = lti.tenantID
    inner join leaseInfo l on l.leaseID = lti.leaseID
    inner join houseInfo h on h.houseID = l.houseID
    where
    ${datas.map(d => '(ptm.name=? and ptm.source=?)').join(' or ')}`, datas.reduce((acc, d) => { 
        acc.push(d.name);
        acc.push(d.source);
        return acc;
    }, []));
    console.log(nameSourceLeaseRows)
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
        data.date = moment(data.date, 'YYYY-MM-DD').toDate();
        data.amount = parseFloat(data.amount);
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
                imported = 'matched';
                console.log(`matched ${name} on ${matched.firstName} ${matched.lastName} for ${amount} ${matched.address}`);                
                await db.doQuery(`insert into rentPaymentInfo(paymentID, receivedDate,receivedAmount,
                        paidBy,leaseID,created,modified,notes)
                        values(?,?,?,
                        ?,?,now(),now(),?)`, [id, date, amount,
                    name, matched.leaseID, notes]);                                
                await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source, matchedTo) values(?,?,?,?,?,?,?)`,
                    [id].concat(parms).concat(id))
            } else {
                await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source) values(?,?,?,?,?,?)`,
                    [id].concat(parms));
            }
            return ({
                ...matched,
                ...data,
                id,
                imported,
            })
        }
    }, { concurrency: 5 });
    const imported = allRes.filter(r => r.imported);
    console.log(`imported=${imported.length}, all itemps ${allRes.length} `);
    const values = allRes.filter(r => r.imported === 'matched').map(data => {
        const date = moment(data.date,'YYYY-MM-DD').format('YYYY-MM-DD');
        return [data.address, date, date, data.amount, data.notes, data.name, data.source, data.id]
    });

    if (values.length) {
        await sheet.appendSheet(sheetId, `'Total rent payment info'!A1`, values, 'USER_ENTERED');
    }
    return allRes;
}


//submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));

module.exports = {
    submit,
}