const get = require('lodash/get');
const sheet = require('../lib/getSheet').createSheet();
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');

async function importAndMatchPayments() {
    async function readSheet() {
        const res = await sheet.readRanges(sheetId, [`'Copy of Sheet11'!A:L`]);
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
                row: i,
            })
            return acc;
        }, []);


        const payments = await db.doQuery(`select paymentID, receivedDate date, receivedAmount amount,
         paidBy name,
        notes, h.address
        from rentPaymentInfo rp inner join leaseInfo l on rp.leaseID=l.leaseID
        inner join houseInfo h on h.houseID=l.houseID`);

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
        });

        const mp = fromRentSheet.map(p => {
            const matched = paymentsByAmount[p.amount];
            console.log(`matched by amount ` + p.amount);

            if (!matched) return;
            const first = matched.find(m => {
                if (m.matched) return null;
                const diff = Math.abs(m.date.diff(p.date, 'days'));
                if (diff < 3) {
                    m.matched = true;
                    m.diff = m.date.diff(p.date, 'days');
                    m.row = p.row;
                    return m;
                }
            });
            return first;
        }).filter(x => x);

        console.log(mp.map(m => `${m.amount} ${m.date.format('YYYY-MM-DD')} ${m.diff} ${m.row}`));


        await Promise.map(mp, async m => {
            const row = m.row + 1;
            await sheet.updateSheet(sheetId, [`'Copy of Sheet11'!E${row}:I${row}`], [
               [m.date.format('YYYY-MM-DD'), m.amount, m.address, m.name, m.notes]
            ]);
        },{concurrency: 1});
        
        
    });
}

module.exports = {
    importAndMatchPayments,
}
