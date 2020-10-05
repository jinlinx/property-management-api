module.exports={
    fields:
        [
            {field: 'id', desc: 'Id', type: 'uuid', isId: true, },
            {field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: {table: 'workerInfo', field: 'workerID'}},
            {field: 'schedule', desc: 'Schedule, Monthly usually'},
            {field: 'type', desc: 'Percent or amount'},
            {field: 'amount', desc: 'Percent', type: 'decimal'},
            {field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field: 'leaseID'}},
        ]
};