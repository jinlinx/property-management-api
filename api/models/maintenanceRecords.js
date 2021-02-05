module.exports = {
    fields:
        [
            { field: 'id', desc: 'Id' , type: 'uuid', required: true, isId: true},
            { field: 'date', desc: 'date', type: 'date' },
            { field: 'description', desc: 'description:' },
            { field: 'amount', type: 'decimal', },
            { field: 'houseID', desc: 'House ID', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'expenseCategoryId', desc: 'category' },
            { field: 'house', type: 'decimal' },
            { field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: { table: 'workerInfo', field: 'workerID' } },
            { field: 'ownerID', desc: 'Owner ID', require: true, foreignKey: {table: 'ownerInfo', field:'ownerID'}, type: 'int' },
            { field: 'comment', desc: 'comment' },
        ]
};