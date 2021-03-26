module.exports = {
    fields:
        [
            { field: 'maintenanceID', desc: 'Id' , type: 'uuid', required: true, isId: true},
            { field: 'date', desc: 'date', type: 'date' },
            { field: 'month', desc: 'month', dontShowOnEdit: true },
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
            { name: 'workerFirstName', field: 'firstName', desc: 'FirstName', table: 'w' },
            { name: 'workerLastName', field: 'lastName', desc: 'LastName', table: 'w' },
            { name: 'workerEmail', field: 'email', desc: 'Worker Email', table: 'w' },
            { name: 'address', desc: 'House', table: 'h' },
        ],
        extraViewJoins: ' inner join workerInfo w on w.workerID=maintenanceRecords.workerID left join houseInfo h on h.houseID = maintenanceRecords.houseID ',
    }
};