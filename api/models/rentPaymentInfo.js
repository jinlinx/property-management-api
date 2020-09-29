module.exports = {
    fields:
        [
            { field: 'paymentID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'receivedDate', desc: 'Received Date', type:'date'  },
            { field: 'receivedAmount', desc: 'Received Amount', type: 'decimal' },
            { field: 'paidBy', desc: 'Paid By',  },
            { field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field:'leaseID'}},
        ]
};