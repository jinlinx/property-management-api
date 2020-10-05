module.exports={
    fields:
        [
            { field: 'id', desc: 'Id', type: 'uuid', isId: true, },
            { field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: { table: 'workerInfo', field: 'workerID' } },
            { field: 'date', desc: 'date', type: 'datetime' },
            { field: 'amount', desc: 'Amount', type: 'decimal' },
            { field: 'title', desc: 'Desc' },
        ]
};