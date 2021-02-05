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
        console.log('start');
        const sqlFreeForm = db.doQuery;
        const xieOwnerId = (await db.doQueryOneRow(`select ownerID from ownerInfo where shortName='Xie'`))['ownerID'];
        console.log(`xieOwernId=${xieOwnerId}`);
        console.log(xieOwnerId)
        return await Promise.map(result.res, async data => {
            if (data.category && !cats[data.category]) {
                console.log('Creating category ' + data.category);
                const id = uuid.v1();
                cats[data.category] = id;
                await sqlFreeForm(`insert into expenseCategories(expenseCategoryID,expenseCategoryName) values
                ('${id}','${data.category}')`);
            }

            if (data.house) {
                const curHouse = houses[data.house];
                if (!curHouse) {
                    console.log('Creating house ' + data.house);
                    const id = uuid.v1();
                    houses[data.house] = { houseID: id };
                    await sqlFreeForm(`insert into houseInfo(houseID,address) values
                ('${id}','${data.house}')`);
                } else if (!curHouse.ownerID) {
                    await sqlFreeForm(`update houseInfo set ownerID = '${xieOwnerId}' where houseID='${curHouse.houseID}'`);
                    curHouse.ownerID = xieOwnerId;
                }
            }
            
            //console.log(data);
            //const owner = await sqlFreeForm(`select ownerID from ownerInfo where ownerName=?`, [data.owner]);
            return;
            const owner = await sqlFreeForm(`select ownerID from ownerInfo where ownerName=?`, [data.owner]);
            let ownerID;
            if (!owner[0]) {
                ownerID = uuid.v1();
                await sqlFreeForm(`insert into ownerInfo(ownerID,ownerName,shortName,created,modified)
        values(?,?,?,now(),now())`, [ownerID, data.owner, data.owner]);
            } else {
                ownerID = owner[0].ownerID;
            }
            const r = await sqlFreeForm(`select houseID from houseInfo where Address = ?`, [data.addr]).catch(err => {
                console.log(err)
            });
            let houseID = null;
            if (!r[0]) {
                houseID = uuid.v1();
                await sqlFreeForm(`insert into houseInfo (houseID,address,city,state, zip,ownerID, created,modified)
        values(?,?,?,?,?,?,now(),now())`, [houseID, data.addr, data.city, data.state, data.zip, ownerID]).catch(err => {
                    console.log(err.response.body)
                })
            } else {
                houseID = r[0].houseID;
            }
            let leaseID = null;
            const lease = await sqlFreeForm(`select leaseID from leaseInfo where houseID=? and endDate>now()`, [houseID]);
            if (lease[0]) {
                leaseID = lease[0].leaseID;
            } else {
                leaseID = uuid.v1();
                let rent = parseFloat(data.rent.split('/')[0].replace(/\$/g, ''));
                if (isNaN(rent)) {
                    console.log(`failed to do rent ${data.rent}`);
                    rent = 0;
                }
                console.log(`rent=${rent} lease=${data.lease}`);                                
                const doParse = (d, def) => {
                    if (!d) return def;
                        const mm = moment(d);
                        if (mm.isValid()) return mm.toDate();
                        return def;
                    }
                    const leaseParts = data.lease.split('-');
                const startDate = doParse(leaseParts[0], new Date());
                const endDate = doParse(leaseParts[1],moment().add(1, 'year').toDate());
                console.log(`startdate ${startDate.toISOString()} end ${endDate.toISOString()}`)
                await sqlFreeForm(`insert into leaseInfo (leaseID, houseID, 
                    startDate, endDate,
                    monthlyRent,
                     comment, created, modified)
        values (?,?,
            ?, ?,
            ?,
            ?,now(),now())`, [leaseID, houseID,
                startDate, endDate,
            rent,
                    `${data.addr} ${data.rent}`])
            }

            const names = data.name.split(' ');
            const { firstName, lastName } = names.reduce((acc, n) => {
                const name = n.trim();
                if (name) {
                    if (!acc.firstName)
                        acc.firstName = name;
                    else
                        acc.lastName = name;
                }
                return acc;
            }, { firstName: '', lastName: '' });
            const tenant = await sqlFreeForm(`select tenantID from tenantInfo where firstName=? and lastName=?`, [firstName, lastName]);
            let tenantID = null;
            if (!tenant[0]) {
                tenantID = uuid.v1();
                await sqlFreeForm(`insert into tenantInfo( tenantID,firstName, lastName, email, phone, created, modified)
        values(?,?,?,?,?,now(),now())`, [tenantID, firstName, lastName,
                    data.email, data.phone,
                ]);
            } else {
                tenantID = tenant[0].tenantID;
            }
            const leaseTen = await sqlFreeForm(`select leaseID from leaseTenantInfo where leaseID=? and tenantId=?`, [leaseID, tenantID]);
            if (!leaseTen.length) {
                await sqlFreeForm(`insert into leaseTenantInfo(leaseID,tenantId) values(?,?)`, [leaseID, tenantID]);
            }
            console.log(`lease id ${leaseID} ${houseID} ${firstName} ${lastName} ${data.email || ''}`);
            return {
                leaseID,
                houseID,
                tenantID,
                ownerID,
                firstName,
                lastName,
                email: data.email,
                address: data.addr,
                city: data.city,
                state: data.state,
                zip: data.zip,
                owner: data.owner,
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