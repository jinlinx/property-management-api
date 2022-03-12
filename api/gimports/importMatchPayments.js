const get = require('lodash/get');
const sheet = require('../lib/googleApiReq').getClient('test')
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');
const { addHouse } = require('./importPropertyMaintence');
const {getOrCreateLease } = require('./import');
const sheetName = 'Copy of Sheet11';
async function importAndMatchPayments() {
    async function readSheet() {
        const res = await sheet.readRanges(sheetId, [`'${sheetName}'!A:F`]);
        const data = get(res, 'data.valueRanges.0.values');
        return data;
    }


    return readSheet().then(async rentData => {
        const fromRentSheet = rentData.reduce((acc, r, i) => {
            if (!i) return acc;
            acc.push({
                date: moment(r[0], 'M/D/YYYY'),
                amount: parseFloat(r[1].replace('$', '').replace(',', '').trim()).toFixed(2),
                house: r[2],
                comment: r[3],
                existingAmount: parseFloat(r[5]).toFixed(2),
                row: i,
            })
            return acc;
        }, []);


        const payments = await db.doQuery(`select rp.paymentID, receivedDate date, receivedAmount amount,
         paidBy name,
        rp.notes, h.address,
        imp.source
        from rentPaymentInfo rp inner join leaseInfo l on rp.leaseID=l.leaseID
        inner join houseInfo h on h.houseID=l.houseID
        left join importPayments imp on imp.paymentID = rp.paymentID`);

        const paymentsByAmount = payments.reduce((acc, p) => {
            const amount = p.amount.toFixed(2);
            p.amount = amount;
            p.date = moment(p.date);
            let rows = (acc[amount]);
            if (!rows) {
                rows = [];
                acc[amount] = rows;
            }
            rows.push(p);
            return acc; 
        },[]);

        const mp = fromRentSheet.map(p => {
            const matched = paymentsByAmount[p.amount];

            if (!matched) {
                //console.log(`not matched by amount ` + p.amount);
                return;
            }
            //console.log(`matched by amount ` + p.amount);
            const first = matched.find(m => {
                if (m.matched) return null;
                const diff = Math.abs(m.date.diff(p.date, 'days'));
                if (diff < 3) {
                    m.matched = p;
                    m.diff = m.date.diff(p.date, 'days');
                    m.row = p.row;
                    p.matched = m;
                    if (p.existingAmount === m.amount) return null;
                    return m;
                } else {
                    //console.log(`not matched ${p.amount} ${p.date}`)
                }
            });
            return first;
        }).filter(x => x);

        console.log(mp.map(m => `${m.amount} ${m.date.format('YYYY-MM-DD')} ${m.diff} ${m.row}`));

        await Promise.map(mp, async m => {
            const row = m.row + 1;
            await sheet.updateSheet(sheetId, [`'${sheetName}'!E${row}:J${row}`], [
               [m.date.format('YYYY-MM-DD'), m.amount, m.address, m.name, m.notes, m.source]
            ]);
        },{concurrency: 1});
        

        const newPayments = payments.filter(p => !p.matched).map(p => {
            return {
                date: p.date.format('YYYY-MM-DD'),
                amount: p.amount,
                address: p.address,
                notes: p.notes,
                source: p.source,
                name: p.name,
            }
        })
        console.log(newPayments);
        await sheet.appendSheet(sheetId, [`'${sheetName}'!A:J`],
            newPayments.map(p => [p.date, p.amount, p.address, p.notes, p.date, p.amount, p.address, p.name, '', p.source]),
            valueInputOption = 'USER_ENTERED'
        );

        const needInserts = fromRentSheet.filter(x => !x.matched).map(r => {
            return {
                date: r.date.format('YYYY-MM-DD'),
                amount: r.amount,
                house: r.house.trim(),
                comment: r.comment.trim()
            }
        });
        console.log(needInserts);

        const houses = {};
        await Promise.map(needInserts, async p => {
            const houseID = await addHouse(houses, p.house);
            const paymentID = uuid.v1();
            const leaseID = await getOrCreateLease(houseID);
            console.log(`leaseID for house ${houseID} is ${leaseID}`);
            const insertSql = `insert into  rentPaymentInfo(paymentID, receivedDate, month, receivedAmount, notes, leaseID)
            values (?,?,?,?,?)`;
            console.log(insertSql);
            await db.doQuery(insertSql, [paymentID, p.date, moment(p.date).format('YYYY-MM'), p.amount,
                p.comment, leaseID
            ])
        }, {concurrency: 1});
    });
}

module.exports = {
    importAndMatchPayments,
}
