const {formatterYYYYMMDD}=require( '../util/util' );
const formatter=formatterYYYYMMDD;
module.exports={
    fields:
        [
            {field: 'paymentID', desc: 'Id', type: 'uuid', required: true, isId: true, foreignKey: {table: 'rentPaymentInfo', field: 'paymentID'}},
            {field: 'workerID', desc: 'Id', type: 'uuid', required: true, isId: true, foreignKey: {table: 'workerInfo', field: 'workerID'}},
            {field: 'receivedDate', desc: 'Received Date', type: 'date'},
            {field: 'receivedAmount', desc: 'Received Amount', type: 'decimal'},
            {field: 'paidBy', desc: 'Paid By', },
            {field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field: 'leaseID'}},
            {field: 'settlementID', desc: 'Settlement ID'},
            {field: 'settlementDate', desc: 'Settlement Date', type: 'date'},
        ]
};