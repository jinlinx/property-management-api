const get = require('lodash/get');
const sheet = require('../lib/getSheet').createSheet();
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');
const { addHouse } = require('./importPropertyMaintence');

function fixAmt(amt) {
    if (amt.trim().indexOf('(') >= 0) {
        amt = amt.replace('(', '-');
        amt = amt.replace(')', '');
    }
    return amt;
}
async function importPayments() {
    async function readSheet() {
        const res = await sheet.readRanges(sheetId, [`'PaymentRecord'!A:E`]);
        const data = get(res, 'data.valueRanges.0.values');
        return data;
    }


    return readSheet().then(async rentData => {
        const result = rentData.slice(1).reduce((acc, r) => {
            if (!r[0]) return acc;
            const val = {
                date: moment(r[0],'M/D/YYYY'),
                amount: r[1].replace(/[\$,]/g, '').trim(),
                address: r[2].trim().toLowerCase(),
                type: r[3].trim().toLowerCase(),
                comment: r[4],
            }
            acc.push(val);
            return acc;
        }, []).filter(x=>x).filter(x=>x.date.isValid());



        //console.log(result.res);

        const paymentTypes = (await db.doQuery('select paymentTypeID,paymentTypeName,isIncome from paymentType order by displayOrder'))
            .reduce((acc, k) => {
                acc[k.paymentTypeName.toLowerCase()] = k.paymentTypeID;
            return acc;
        }, {});

        const houses = (await db.doQuery('select * from houseInfo')).reduce((acc, h) => {
            acc[h.address.trim().toLowerCase()] = h;
            return acc;
        }, {});
        
        console.log('start');
        const sqlFreeForm = db.doQuery;
        const xieOwnerId = (await db.doQueryOneRow(`select ownerID from ownerInfo where shortName='Xie'`))['ownerID'];
        console.log(`xieOwernId=${xieOwnerId}`);
        return await Promise.map(result, async data => {
            const paymentTypeId = paymentTypes[data.type];
            let houseID = '';
            if (data.address) {
                houseID = await addHouse(houses, data.address, xieOwnerId);                
            }
            
            const mdate = data.date;
            if (!mdate.isValid()) return 0;
            const date = mdate.format('YYYY-MM-DD')
            const month = mdate.clone().startOf('month').format('YYYY-MM');
            const amount = fixAmt(data.amount);
            //console.log(`Checking payment rec`);            
            const prms = [date, month, houseID, paymentTypeId || '',
                amount || 0, data.comment || ''];
            //console.log(prms);
            const mrs = await sqlFreeForm(`select paymentID from rentPaymentInfo
            where receivedDate=? and month=? and houseID=? and paymentTypeID=?
             and receivedAmount=? and notes=?`, prms);
            if (!mrs[0]) {
                const id = uuid.v1();
                console.log(`Inserting payment rec ${id}`);
                console.log(prms);
                await sqlFreeForm(`insert into rentPaymentInfo(
                    paymentID, receivedDate, month, houseID, paymentTypeID,
                    receivedAmount, notes)
        values(?,?,?,?, ?,?,?)`, [id, ...prms]);
                return 1;
            }

            return 0;
        }, { concurrency: 1 }).catch(err => {
            console.log(err);
        });
    });
}



module.exports = {
    importPayments,
}
