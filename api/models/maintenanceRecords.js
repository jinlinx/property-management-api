module.exports = {
    fields:
        [
            { field: 'maintenanceID', desc: 'Id' , type: 'uuid', required: true, isId: true},
            { field: 'date', desc: 'date', type: 'date' },
            { field: 'month', desc: 'month', type: 'date' },
            { field: 'description', desc: 'description:' },
            { field: 'amount', type: 'decimal', },
            { field: 'houseID', desc: 'House ID', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'expenseCategoryId', desc: 'category', foreignKey: { table: 'expenseCategories', field: 'expenseCategoryID' } },
            { field: 'hours', type: 'decimal' },
            { field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: { table: 'workerInfo', field: 'workerID' } },
            { field: 'ownerID', desc: 'Owner ID', require: true, foreignKey: {table: 'ownerInfo', field:'ownerID'}, type: 'int' },
            { field: 'comment', desc: 'comment' },
        ],
    view: {
        name: 'view_maintenanceRecords',
        fields: [
            { name: 'firstName', field: 'workerFirstName', desc: 'FirstName', table: 'w' },
            { name: 'lastName', field: 'workerLastName', desc: 'LastName', table: 'w' },
            { name: 'email', field: 'workerEmail', desc: 'Worker Email', table: 'w' },
            { field: 'address', desc: 'House', table: 'h' },
        ],
        extraViewJoins: ' inner join workerInfo w on w.workerID=maintenanceRecords.workerID left join houseInfo h on h.houseID = maintenanceRecords.houseID ',
    }
};