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


import { sortBy } from 'lodash';
const assert = require('assert');
const gs = require('../statementpuller/processors/procAndCompGeneric');
describe('statement import matches', function () {

    function getDbData() {
        return [
            {
                "date": "old date1",
                "desc": "bought parts in homedepot",
                "amount": 1,
                "house": "db0 some Ave.",
                "cat": "Supplies"
            },
            {
                "date": "old date1",
                "desc": "boo",
                "amount": 2.2,
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
            "amount": 3
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
        assert.equal(mch.data.date, 'new date1');
        assert.equal(mch.matchedTo, null);
        assert.equal(mch.matchScore, -1);
    });

    it('should not match statements for date and amount without addr', function () {
        const dbData = getDbData();
        const newData = getNewData();
        newData.date = "old date1"; 
        newData.amount = -2.2;
        const matched = gs.doBoaDataCmp(
            dbData,
            newData);
        assert.equal(1, matched.length);
        const mch = matched[0];
        assert.equal(mch.done, true);
        assert.equal(mch.data.date, 'new date1');
        assert.equal(mch.matchedTo, null);
        assert.equal(mch.matchScore, -1);
    });


    it('should match statements for date and amount without addr', function () {
        const dbData = getDbData();
        const newData = getNewData();
        newData[0].date = "old date1";
        newData[0].amount = 2.2;
        dbData.forEach(d=>d.house = null);
        const matched = gs.doBoaDataCmp(
            dbData,
            newData);
        assert.equal(1, matched.length);
        const mch = matched[0];
        assert.equal(mch.done, true);
        assert.notEqual(mch.matchedTo, null);
        assert.equal(mch.matchScore, 0);
    });

    it('should match with perfered items', function () {
        const dbData = []; 
        for (let i = 1; i <= 3; i++) {
            dbData[i*2] = {
                date: `d${i}`,
                amount: i,
                house: 'hh',
            }
            dbData[i * 2 + 1] = {
                date: `d${i}`,
                amount: i,
                house: '',
                reference: i,
            }
        };

        dbData.push({
            date: 'd4', //for id6 and 7
            amount: 4,
            reference: 'matchedRefTo7',
        });
        dbData.push({
            date: 'd4', //for id6 and 7
            amount: 4,
            reference: 'matchedRefToNothing',
        });
        dbData.push({
            date: 'd4', //for id6 and 7
            amount: 4,
            reference: 'matchedRefToNothing2',
        });

        dbData.push({
            date: 'd5', //for id6 and 7
            amount: 5,
            reference: 'match',
        })

        const newData = [
            {
                id: 1,
                date: 'd1',
                amount: -1,
                reference: 10, // msi matched reference
            },
            {
                id: 2,
                date: 'd1',
                amount: -1,
                reference: 1, // matched reference
            },
            {
                id: 3,
                date: 'd0',
                amount: -1,
                reference: 1, //not matched reference
            },

            {
                id: 4,
                date: 'd2',
                amount: -2, //match but not matched reference
            },
            {
                id: 5,
                date: 'd3',
                amount: -3,
                reference: 3, //match and match reference
            },
            {
                id: 6,
                date: 'd4',
                amount: -4, //2 pk match, 1 with ref and one not, with extra db item
            }, {
                id: 7,
                date: 'd4',
                amount: -4, //2 pk match, 1 with ref and one not, with extra db item
                reference: 'matchedRefTo7'
            },
            {
                id: 8,
                date: 'd5',
                amount: -5, //2 pk match, only 1 db has it
                reference: 'match'
            }, {
                id: 9,
                date: 'd5',
                amount: -5, //2 pk match, only 1 db has it
                reference: 'match'
            },
        ].map(n => {
            return {
                ...n,
                amount: -n.amount,
            }
        });
        const matched = gs.doBoaDataCmp(
            dbData,
            newData);
        //assert.equal(matched.length, 7);
        const res = sortBy(matched.map(n => {
            return {
                id: n.data.id,
                done: n.done,
                matchScore: n.matchScore,
                matchedTo: !!n.matchedTo
            }
        }), ['id']);
        assert.deepEqual(res, [
            { id: 1, done: true, matchScore: -1, matchedTo: false },
            { id: 2, done: true, matchScore: 1, matchedTo: true },
            { id: 3, done: true, matchScore: -1, matchedTo: false },
            { id: 4, done: true, matchScore: 0, matchedTo: true },
            { id: 5, done: true, matchScore: 1, matchedTo: true },
            { id: 6, done: true, matchScore: 0, matchedTo: true },
            { id: 7, done: true, matchScore: 1, matchedTo: true },
            { id: 8, done: true, matchScore: 1, matchedTo: true },
            { id: 9, done: true, matchScore: -1, matchedTo: false }
        ]);        
    });
});
*/