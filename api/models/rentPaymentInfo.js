module.exports = {
    fields:
        [
            { field: 'paymentID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'receivedDate', desc: 'Received Date', type: 'datetime' },
            { field: 'receivedAmount', desc: 'Received Amount', type: 'decimal' },
            { field: 'paidBy', desc: 'Paid By', },
            { field: 'notes', desc: 'Notes', },
            { field: 'month', desc: 'Month', },
            { field: 'paymentTypeID', desc: 'PaymentType', foreignKey:{table:'paymentType', field:'paymentTypeID'} },
            { field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field:'leaseID'}},
            { field: 'paymentProcessor', desc: 'Processor', },
        ],
        view:{
            name: 'view_rentPaymentInfo',
            fields:[
                { name: 'comment', field: 'comment', desc: 'Lease Comment', table: 'leaseInfo' },
                { name: 'paymentTypeName', field: 'paymentTypeName', desc: 'Payment Type', table: 'paymentType' },
                { field: 'isIncome', desc: 'IsPaymentIncome', table: 'paymentType' },
                { name: 'address', field: 'address', desc: 'House', table: 'h' },
            ], 
            extraViewJoins: ' left join houseInfo h on h.houseID = leaseInfo.houseID ',
        }
};