//const request = require('superagent');
const db = require('../../api/lib/db');
const Promise = require('bluebird');
const uuid = require('uuid');
//const sheet = require('./getSheet').createSheet();
const moment = require('moment');
//const sheetId = '1sKppFHJy_MRRgHuV2PzhliSzuje7O0Rb-ntiOrLDVPA';
async function submit(datas, opts) {
    const log = opts.log;
    let cur = 0;
    //await sheet.appendSheet(sheetId, `'Sheet1'!A1`, datas.map(data => [data.date, data.amount, data.name, data.notes, data.source]));    
    const allRes = await Promise.map(datas, async data => {
        const me = cur++;
        log(`processing ${me}/${datas.length}`);        
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
            await db.doQuery(`insert into importPayments (id,date, amount, name,notes, source) values(?,?,?,?,?,?)`,
                    [id].concat(parms));            
            return ({
                ...data,
                id,
                imported: 1,
            })
        }
    }, { concurrency: 5 });
    const imported = allRes.filter(r => r.imported);
    log(`imported=${imported.length}, all itemps ${allRes.length} `);
    const matchedValues = allRes.filter(r => r.imported === 'matched').map(data => {
        const date = moment(data.date,'YYYY-MM-DD').format('YYYY-MM-DD');
        //return [data.address, date, date, data.amount, data.notes, data.name, data.source, data.ownerName]
        return {
            ...data,
            date,
        }
    });

    // don't do google sheet
    // if (matchedValues.length) {
    //     const groupedByOwner = matchedValues.reduce((acc, data) => {
    //         const { ownerName, date} = data;
    //         let ownAry = acc.ownerByKey[ownerName];
    //         if (!ownAry) {
    //             ownAry = [];
    //             acc.ownerByKey[ownerName] = ownAry;
    //             acc.ownerArray.push(ownAry);
    //         }
    //         ownAry.push(data);
    //         return acc;   
    //     }, {            
    //         ownerArray: [],
    //         ownerByKey: {},
    //     });        
    //     await Promise.map(groupedByOwner.ownerArray, async ownAry => {
    //         if (ownAry.length > 0) {
    //             const ownerName = ownAry[0].ownerName;
    //             console.log(`do owner ${ownerName} ${ownAry.length}`);
    //             const gvals = ownAry.map(data => [data.address, data.date, data.date, data.amount, data.notes, data.name, data.source, data.ownerName])
    //             await sheet.appendSheet(sheetId, `'Total rent payment info ${ownerName}'!A1`, gvals, 'USER_ENTERED');
    //         }
    //     }, {concurrency: 1});        
    // }
    return {
        allRes,
        //matched: await matchImports(),
    };
}

/// id: id of importPayment
async function matchImports(ids, paymentTypeID) {
    let importID = uuid.v1();
    if (!ids) return {
        message:'must specify ids'
    }
    if (!paymentTypeID) {
        return {
            message: 'missing paymentTypeID'
        }
    }
    if (ids && ids.length == 1) {
        importID = ids[0];
    }
    //await sheet.appendSheet(sheetId, `'Sheet1'!A1`, datas.map(data => [data.date, data.amount, data.name, data.notes, data.source]));    
    console.log(`importID=${importID}`);
    await db.doQuery(`update 
    importPayments i 
    inner join payerTenantMapping ptm on i.name = ptm.name and i.source = ptm.source
    inner join tenantInfo t on ptm.tenantID = t.tenantID    
    inner join leaseTenantInfo lti on ptm.tenantID = lti.tenantID
    inner join leaseInfo l on l.leaseID = lti.leaseID
    inner join houseInfo h on h.houseID = l.houseID   
    left outer join ownerInfo o on o.ownerID = h.ownerID
    set i.leaseID=lti.leaseID, i.houseID=h.houseID, i.tenantID=t.tenantID, i.ownerID=o.ownerID,i.address=h.address, i.ownerName=o.ownerName, importID=?
    where i.matchedTo is null and i.id in (${id.map(x=>'?').join(',')})`, [importID, ...ids]);
    
    await db.doQuery(`insert into rentPaymentInfo(paymentID, receivedDate,receivedAmount,
        month,
                        paidBy,leaseID,created,modified,notes,
                        paymentProcessor,
                        paymentTypeID
                        )
                        select id, date, amount,
                        DATE_FORMAT(date, '%Y-%m'),
                        name, leaseID ,now(),now(),notes,
                        source, ?
                         from importPayments where importID=?`, [paymentTypeID, importID]);
    
    await db.doQuery(`update importPayments set matchedTo=id where importID=?`, [importID]);
    const imported = await db.doQuery(`select 
    i.id, i.date, i.amount, i.notes,
    i.tenantID, i.name, i.source , i.leaseID,
    i.address, i.ownerName
    from importPayments i
    where importID=?`,[importID]);
        
    console.log(`imported=${imported.length} `);
    const matchedValues = imported.map(data => {
        const date = moment(data.date, 'YYYY-MM-DD').format('YYYY-MM-DD');
        //return [data.address, date, date, data.amount, data.notes, data.name, data.source, data.ownerName]
        return {
            ...data,
            date,
        }
    });

    if (matchedValues.length) {
        const groupedByOwner = matchedValues.reduce((acc, data) => {
            const { ownerName } = data;
            let ownAry = acc.ownerByKey[ownerName];
            if (!ownAry) {
                ownAry = [];
                acc.ownerByKey[ownerName] = ownAry;
                acc.ownerArray.push(ownAry);
            }
            //ownAry.push([data.address, date, date, data.amount, data.notes, data.name, data.source, ownerName]);
            ownAry.push(data);
            return acc;
        }, {
            ownerArray: [],
            ownerByKey: {},
        });
        await Promise.map(groupedByOwner.ownerArray, async ownAry => {
            if (ownAry.length > 0) {
                const ownerName = ownAry[0].ownerName;
                console.log(`do owner ${ownerName} ${ownAry.length}`);
                const gvals = ownAry.map(data => [data.address, data.date, data.date, data.amount, data.notes, data.name, data.source, data.ownerName])
                await sheet.appendSheet(sheetId, `'Total rent payment info ${ownerName}'!A1`, gvals, 'USER_ENTERED');
            }
        }, { concurrency: 1 });
    }
    return matchedValues;
}


//submit(JSON.parse(fs.readFileSync('./outputData/paypal.json')));

module.exports = {
    submit,
    matchImports,
}