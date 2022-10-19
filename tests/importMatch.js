/*
const mail = require('../api/lib/nodemailer');

const sql = require('../api/lib/mysql');

sql.createConn().doQuery(`select * from  test1 where id in (?,?,?)`, [1, 2,3]).then(r => {
    console.log(r);
})

mail.sendHotmail({
    from: 'ggbot <gzh@hotmail.com>',
    to: ['gz@hotmail.com'],
    subject: 'testsub',
    text:'test body'
})

*/

const assert = require('assert');
const gs = require('../statementpuller/lib/gsheet');
describe('statement import matches', function () {

    function getDbData() {
        return [
            {
                "date": "old date1",
                "desc": "bought parts in homedepot",
                "amount": 'old amt1',
                "house": "db0 some Ave.",
                "cat": "Supplies"
            },
            {
                "date": "old date1",
                "desc": "boo",
                "amount": 'old amt2',
                "house": "db1 some ave",
                "cat": "Supplies"
            },
        ]
    };
    function getNewData() {
        return [{
            "date": "new date1",
            "reference": "new Reference Number",
            "payee": "Payee",
            "address": "Address",
            "amount": 'new amt1'
        }];
    }

    it('should not match statements', function () {
        const dbData = getDbData();
        const newData = getNewData();
        const matched = gs.doBoaDataCmp(
            dbData,
            newData);
        assert.equal(1, matched.length);
        const mch = matched[0];
        assert.equal(mch.done, true);
        console.log('assert date ', mch.data.date, '2022-10-01')
        assert.equal(mch.data.date, 'new date1');
        assert.equal(mch.matchedTo, null);
        assert.equal(mch.matchScore, -1);
    });

    it('should match statements for date and amount', function () {
        const dbData = getDbData();
        const newData = getNewData();
        newData.date = "old date1"; 
        newData.amount = 'old amt1';
        const matched = gs.doBoaDataCmp(
            dbData,
            newData);
        assert.equal(1, matched.length);
        const mch = matched[0];
        console.log(matched)
        assert.equal(mch.done, true);
        assert.equal(mch.data.date, 'new date1');
        assert.notEqual(mch.matchedTo, null);
        assert.equal(mch.matchScore, -1);
    });
});