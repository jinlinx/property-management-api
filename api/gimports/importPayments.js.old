const get = require('lodash/get');
const sheet = require('../lib/googleApiReq').getClient('test')
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');
const { toKey, addHouse } = require('./importPropertyMaintence');

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
                address: r[2].trim(),
                type: r[3].trim(),
                comment: r[4],
                origData: r,
            }
            acc.push(val);
            return acc;
        }, []).filter(x=>x).filter(x=>x.date.isValid());



        //console.log(result.res);        
        const paymentTypes = (await db.doQuery('select paymentTypeID,paymentTypeName,includeInCommission from paymentType order by displayOrder'))
            .reduce((acc, k) => {
                acc[toKey(k.paymentTypeName)] = k.paymentTypeID;
            return acc;
        }, {});

        const houses = (await db.doQuery('select * from houseInfo')).reduce((acc, h) => {
            acc[toKey(h.address)] = h;
            return acc;
        }, {});
        
        console.log('start');
        const sqlFreeForm = db.doQuery;
        const xieuserID = (await db.doQueryOneRow(`select userID from userInfo where shortName='Xie'`))['userID'];
        console.log(`xieOwernId=${xieuserID}`);
        return await Promise.map(result, async data => {
            try {
                let paymentTypeId = paymentTypes[toKey(data.type)];
                if (!paymentTypeId) {
                    paymentTypeId = uuid.v1();
                    const isRent = toKey(data.type) === 'rent';
                    paymentTypes[toKey(data.type)] = paymentTypeId;
                    await sqlFreeForm(`insert into  paymentType(paymentTypeID, paymentTypeName, includeInCommission, displayOrder)
                values(?,?,?,?)`, [paymentTypeId, data.type, isRent ? '1' : '0', isRent ? 0 : 99]);
                }
                let houseID = '';
                //if (data.address) {
                houseID = await addHouse(houses, data.address, xieuserID);
                //}
            
                const mdate = data.date;
                if (!mdate.isValid()) return {
                    count: 0,
                    error: 1,
                    data: data.origData,
                    message: `Date is invalid`,
                };
                const date = mdate.format('YYYY-MM-DD')
                const month = mdate.clone().startOf('month').format('YYYY-MM');
                const amount = fixAmt(data.amount);
                if (data.amount === '' && data.address === '' && data.type === '') {
                    return {
                        count: 0,
                    }
                }
                if (typeof(amount) === 'string' && !amount.match(/^[-+]{0,1}[0-9]+(\.[0-9]*){0,1}$/)) {
                    console.log(`bad record, amount invaoid ${amount}`);
                    console.log(data.origData);
                    return {
                        count: 0,
                        error: 1,
                        data: data.origData,
                        message: `Amount is invalid ${amount}`,
                    };
                }
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
                    return {
                        count: 1,
                    };
                }

                return {
                    count: 0,
                };
            } catch (err) {
                return {
                    count: 0,
                    error: 1,
                    err,
                    data: data.origData,
                    message: `Error happened ${err.message}`
                }
            }
        }, { concurrency: 1 });
    });
}



module.exports = {
    importPayments,
}
