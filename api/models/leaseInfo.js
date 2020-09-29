module.exports = {
    fields:
        [
            { field: 'leaseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'deposit', desc: 'Deposit',  },
            { field: 'endDate', desc: 'End Date', },
            { field: 'startDate', desc: 'Start Date',  },
            { field: 'houseID', desc: 'House ID', foreignKey: {table: 'houseInfo', field:'houseID'}},
            { field: 'comment', desc: 'Comment' },
            { field: 'monthlyRent', desc: 'Monthly Rent', require: true, type: 'decimal', },
        ]
};