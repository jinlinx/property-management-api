const db=require('../lib/db');
const models=require('../models/index');
const keyBy=require('lodash/keyBy');
const uuid=require('uuid');



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
        where rpi.created < DATE_ADD( DATE_ADD(LAST_DAY(NOW()), INTERVAL 1 DAY), INTERVAL - 1 MONTH)
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
        const settlementId=uuid.v1();
        console.log(`Settlement Id is ${settlementId}`);
        await db.doQuery(`update workerRelatedPayments set settlementDate=NOW(), settlementID=? where settlementID is null`, settlementId);

        return res.json({
            message: settlementId
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