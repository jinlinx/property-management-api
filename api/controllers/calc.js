const db=require('../lib/db');
const models=require('../models/index');
const keyBy=require('lodash/keyBy');
const uuid=require('uuid');
const Promise=require('bluebird');
const settlement=require('../models/settlement');


async function calcMonthly(req, res) {
    try {
        await db.doQuery(` insert into workerRelatedPayments 
        (paymentID,       workerID,     receivedDate,   receivedAmount,   paidBy,     leaseID,    created, modified, settlementDate, settlementID
        ,workerCompID, workerCompType, workerCompDayOfMonth
            ) 
        select 
        rpi.paymentID, comp.workerID, rpi.receivedDate, rpi.receivedAmount, rpi.paidBy,rpi.leaseID, NOW(), NOW(), null, null
        ,comp.id, comp.type, comp.amount
        from rentPaymentInfo rpi inner join workerComp comp on rpi.leaseID=comp.leaseID
        where rpi.receivedDate < DATE_ADD( DATE_ADD(LAST_DAY(NOW()), INTERVAL 1 DAY), INTERVAL - 1 MONTH)
        and NOT EXISTS(select 1 from workerRelatedPayments pmts where pmts.workerID=comp.workerID and pmts.paymentID=rpi.paymentID)
        `);
        return res.json({
            message: 'done'
        });
    } catch (err) {
        console.log(err);
        res.send(500, {
            message: err.message,
            errors: err.errors
        });
    }
}



async function settleMonthly(req, res) {
    try {
        const results=[];
        const workers=await db.doQuery(`select workerID, count(1) cnt from  workerRelatedPayments where settlementID is null`);
        if (!workers.length) {
            return res.json({
                message: 'No Workers Found'
            });
        }

        const resultSettlements=await Promise.map(workers, async worker => {
            const settlementId=uuid.v1();
            const workerID=worker.workerID;
            console.log(`Settlement Id is ${settlementId} for ${workerID} cnt=${worker.cnt}`);
            await db.doQuery(`update workerRelatedPayments set settlementDate=NOW(), settlementID=? where settlementID is null and workerId=?`, [settlementId, workerID]);
            await db.doQuery(`update workerRelatedPayments set calculatedAmount=workerCompAmount where workerCompType in('oneTime','amount') and settlementID=? and workerId=?`, [settlementId, workerID]);
            await db.doQuery(`update workerRelatedPayments set calculatedAmount=workerCompAmount*receivedAmount*.01 where workerCompType='percent' and settlementID=? and workerId=?`, [settlementId, workerID]);

            await db.doQuery(`insert into settlement (id,workerID, date, amount, title) select ?,?,NOW(), sum(calculatedAmount) from workerRelatedPayments where settlementID=?`
            [settlementId, workerID, settlementId]);
            const settlement=await db.doQuery(' select * from settlement where settlementID=?', [settlementId]);
            return settlement[0];
        });

        
        return res.json({
            resultSettlements
        });
    } catch (err) {
        console.log(err);
        res.send(500, {
            message: err.message,
            errors: err.errors
        });
    }
}

module.exports={
    calcMonthly,
    settleMonthly,
}