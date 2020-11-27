module.exports = {
    fields:
        [
            { field: 'paymentID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'receivedDate', desc: 'Received Date', type: 'datetime' },
            { field: 'receivedAmount', desc: 'Received Amount', type: 'decimal' },
            { field: 'paidBy', desc: 'Paid By', },
            { field: 'notes', desc: 'Notes', },
            { field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field:'leaseID'}},
        ],
        view:{
            name: 'view_rentPaymentInfo',
            fields:[
                { name: 'comment', field: 'comment', desc: 'Lease Comment', table: 'leaseInfo' },
            ], 
        }
};