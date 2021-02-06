const get = require('lodash/get');
const sheet = require('../lib/getSheet').createSheet();
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');

async function importTenantDataGS() {
    async function readSheet() {
        const res = await sheet.readRanges(sheetId, [`'MaintainessRecord'!A:L`]);
        const data = get(res, 'data.valueRanges.0.values');
        return data;
    }


    return readSheet().then(async rentData => {
        const result = rentData.reduce((acc, r) => {
            if (!acc.posToName) {
                acc.posToName = r.reduce((rr, v, i) => {
                    rr[i] = v.trim().toLowerCase();
                    return rr;
                }, []);
                return acc;
            }

            const val = acc.posToName.reduce((acc, name, i) => {
                    acc[name] = r[i] || '';
                    return acc;
                }, {});
            //if (val.date)
                acc.res.push(val);
            return acc;
        }, {
            posToName: null,
            res: [],
            end: false,
        });



        console.log(result.res);

        const cats = (await db.doQuery('select * from expenseCategories')).reduce((acc, k) => {
            acc[k.expenseCategoryName] = k.expenseCategoryID;
            return acc;
        }, {});

        const houses = (await db.doQuery('select * from houseInfo')).reduce((acc, h) => {
            acc[h.address] = h;
            return acc;
        }, {});

        const workers = (await db.doQuery('select * from workerInfo')).reduce((acc, h) => {
            acc[`${h.firstName} ${h.lastName||''}`.trim()] = h.workerID;
            return acc;
        }, {});
        console.log('start');
        const sqlFreeForm = db.doQuery;
        const xieOwnerId = (await db.doQueryOneRow(`select ownerID from ownerInfo where shortName='Xie'`))['ownerID'];
        console.log(`xieOwernId=${xieOwnerId}`);
        console.log(xieOwnerId)
        return await Promise.map(result.res, async data => {
            let categoryID = cats[data.category];
            if (data.category && !categoryID) {
                console.log('Creating category ' + data.category);
                categoryID = uuid.v1();
                cats[data.category] = categoryID;
                await sqlFreeForm(`insert into expenseCategories(expenseCategoryID,expenseCategoryName) values
                ('${categoryID}','${data.category}')`);
            }

            let houseID = '';
            if (data.house) {
                const curHouse = houses[data.house];
                if (!curHouse) {
                    console.log('Creating house ' + data.house);
                    houseID = uuid.v1();
                    houses[data.house] = { houseID };
                    await sqlFreeForm(`insert into houseInfo(houseID,address) values
                ('${houseID}','${data.house}')`);
                } else if (!curHouse.ownerID) {
                    await sqlFreeForm(`update houseInfo set ownerID = '${xieOwnerId}' where houseID='${curHouse.houseID}'`);
                    curHouse.ownerID = xieOwnerId;
                }
                if (curHouse) {
                    houseID = curHouse.houseID;
                }
            }

            let workerID = '';
            if (data.worker) {
                const fl = data.worker.split(' ').map(n => n.trim());
                const tag = `${fl[0]} ${fl[1] || ''}`.trim();
                workerID = workers[tag];
                if (!workerID) {
                    workerID = uuid.v1();
                    console.log(`creating worker ${tag}`);
                    await sqlFreeForm(`insert into workerInfo(workerID,firstName, lastName) values
                ('${workerID}','${fl[0]}','${fl[1]||''}')`);
                    workers[tag] = id;
                } 
            }
            

            const mdate = moment(data.date, 'M/D/YYYY');
            if (!mdate.isValid()) return;
            const date = mdate.format('YYYY-MM-DD')
            const month = mdate.clone().startOf('month').format('YYYY-MM-DD');
            const amount = data.amount.replace('$', '').replace(',', '').trim();
            const mrs = await sqlFreeForm(`select maintenanceID from maintenanceRecords 
            where date=? and description=? and houseID=? and workerID=? and expenseCategoryId=?
             and amount=? and comment=?`, [date, data.description,
                houseID, workerID, categoryID,
            amount,data.comments]);
            if (!mrs[0]) {
                const id = uuid.v1();
                console.log( [id, date, month, data.description,
                    houseID, workerID, categoryID,
                amount, data.comments])
                await sqlFreeForm(`insert into maintenanceRecords(
                    maintenanceID, date, month,description, houseID, workerID, expenseCategoryId, 
                    amount, comment)
        values(?,?,?,?, ?,?,?, ?,?)`, [id, date, month,data.description,
                    houseID, workerID, categoryID,
                amount || 0, data.comments]);
            } 
            
            
        }, { concurrency: 1 }).catch(err => {
            console.log(err);
        });
    });
}

module.exports = {
    importTenantDataGS,
}

importTenantDataGS().then(r => {
    db.conn.end();
})