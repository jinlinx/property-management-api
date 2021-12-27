const get = require('lodash/get');
const sheet = require('../lib/getSheet').createSheet();
const sheetId = require('../../credentials.json').propertyManagementGSID;
const Promise = require('bluebird');
const db = require('../lib/db');
const uuid = require('uuid');
const moment = require('moment');

function fixAmt(amt) {
    if (amt.trim().indexOf('(') >= 0) {
        amt = amt.replace('(', '-');
        amt = amt.replace(')', '');
    }
    return amt;
}
async function importPropertyMaintenance() {
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
                    acc[name] = (r[i] || '').trim();
                    return acc;
            }, {});
            val.origData = r;
            //if (val.date)
                acc.res.push(val);
            return acc;
        }, {
            posToName: null,
            res: [],
            end: false,
        });



        //console.log(result.res);

        const cats = (await db.doQuery('select * from expenseCategories')).reduce((acc, k) => {
            acc[toKey(k.expenseCategoryName)] = k.expenseCategoryID;
            return acc;
        }, {});

        const houses = (await db.doQuery('select * from houseInfo')).reduce((acc, h) => {
            acc[toKey(h.address)] = h;
            return acc;
        }, {});

        const workers = (await db.doQuery('select * from workerInfo')).reduce((acc, h) => {
            acc[toKey(`${h.firstName} ${h.lastName||''}`)] = h.workerID;
            return acc;
        }, {});
        console.log('start');
        const sqlFreeForm = db.doQuery;
        const xieOwnerId = (await db.doQueryOneRow(`select ownerID from ownerInfo where shortName='Xie'`))['ownerID'];
        console.log(`xieOwernId=${xieOwnerId}`);
        console.log(xieOwnerId)
        return await Promise.map(result.res, async data => {
            try {
                let categoryID = cats[toKey(data.category)];
                if (!data.amount) {
                    return {
                        count: 0,
                        message: 'no amount'
                    }
                }
                if (!categoryID) {
                    console.log('Creating category ' + data.category);
                    categoryID = uuid.v1();
                    cats[toKey(data.category)] = categoryID;
                    await sqlFreeForm(`insert into expenseCategories(expenseCategoryID,expenseCategoryName) values
                ('${categoryID}','${data.category}')`);
                }

                let houseID = '';
                //if (data.house) {
                houseID = await addHouse(houses, data.house || '', xieOwnerId);
                //}

                let workerID = '';
                if (data.worker) {
                    const fl = data.worker.split(' ').map(n => n.trim());
                    const tag = `${fl[0]} ${fl[1] || ''}`.trim();
                    workerID = workers[toKey(tag)];
                    if (!workerID) {
                        workerID = uuid.v1();
                        console.log(`creating worker ${tag}`);
                        await sqlFreeForm(`insert into workerInfo(workerID,firstName, lastName) values
                ('${workerID}','${fl[0]}','${fl[1] || ''}')`);
                        workers[toKey(tag)] = workerID;
                    }
                }
            

                const mdate = moment(data.date, 'M/D/YYYY');
                if (!mdate.isValid()) return 0;
                const date = mdate.format('YYYY-MM-DD')
                const month = mdate.clone().startOf('month').format('YYYY-MM');
                const amount = fixAmt(data.amount.replace('$', '').replace(',', '').trim());
            
                const checkData = [date, month, data.description,
                    houseID, workerID, categoryID,
                    amount || 0, data.comments]
                const mrs = await sqlFreeForm(`select maintenanceID from maintenanceRecords 
            where date=? and month=? and description=? and houseID=? and workerID=? and expenseCategoryId=?
             and amount=? and comment=?`, checkData);
                if (!mrs[0]) {
                    const id = uuid.v1();
                    console.log(`Inserting maintenane rec`);
                    console.log([id, ...checkData]);
                    try {
                        await sqlFreeForm(`insert into maintenanceRecords(
                    maintenanceID, date, month,description, houseID, workerID, expenseCategoryId, 
                    amount, comment)
        values(?,?,?,?, ?,?,?, ?,?)`, [id, ...checkData]);
                    } catch (err) {
                        const errDetail = `error inserting ${JSON.stringify(checkData)}`;
                        console.log(errDetail);
                        console.log(err);
                        return {
                            count: 0,
                            err: `${err.message} ${errDetail} `,
                        }
                    }
                    return {
                        count: 1
                    };
                }
            
                return {
                    count: 0,
                    message: "existing"
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
        }, { concurrency: 1 }).catch(err => {
            console.log(err);
        });
    });
}

const toKey = x => x.trim().toLowerCase();
async function addHouse(houses, address,xieOwnerId) {
    let houseID = '';

    address = (address || '').trim();
    const key = toKey(address);
    const curHouse = houses[key];
    if (!curHouse) {
        console.log('Creating house ' + address);
        houseID = uuid.v1();
        houses[key] = { houseID };
        await db.doQuery(`insert into houseInfo(houseID,address) values
                ('${houseID}','${address}')`);
    } else if (!curHouse.ownerID) {
        await db.doQuery(`update houseInfo set ownerID = '${xieOwnerId}' where houseID='${curHouse.houseID}'`);
        curHouse.ownerID = xieOwnerId;
    }
    if (curHouse) {
        houseID = curHouse.houseID;
    }
    return houseID;
}

module.exports = {
    importPropertyMaintenance,
    addHouse,
    toKey,
}
