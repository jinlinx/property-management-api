const moment = require('moment');
module.exports = {
    fields:
        [
            { field: 'maintenanceID', desc: 'Id' , type: 'uuid', required: true, isId: true},
            { field: 'date', desc: 'date', type: 'date' },
            { field: 'month', desc: 'month', dontShowOnEdit: true, autoValueFunc: row=> moment(row['date']).format('YYYY-MM') },
            { field: 'description', desc: 'description:' },
            { field: 'amount', type: 'decimal', },
            { field: 'houseID', desc: 'House ID', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'expenseCategoryId', desc: 'category', foreignKey: { table: 'expenseCategories', field: 'expenseCategoryID' } },
            { field: 'hours', type: 'decimal' },
            { field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: { table: 'workerInfo', field: 'workerID' } },
            { field: 'ownerID', desc: 'Owner ID', require: true, foreignKey: {table: 'ownerInfo', field:'ownerID'}, type: 'int' },
            { field: 'comment', desc: 'comment' },
            { field: 'vdPosControl', desc: 'PosControl' },
        ],
    view: {
        name: 'view_maintenanceRecords',
        fields: [
            { name: 'workerFirstName', field: 'firstName', desc: 'FirstName', table: 'w' },
            { name: 'workerLastName', field: 'lastName', desc: 'LastName', table: 'w' },
            { name: 'workerEmail', field: 'email', desc: 'Worker Email', table: 'w' },
            { name: 'address', desc: 'House', table: 'h' },
            { name: 'expenseCategoryName', desc: 'Expense', table: 'expc' },
            { name: 'expCatDisplayOrder', field: 'displayOrder', desc: 'Exp Order', table: 'expc' },
        ],
        extraViewJoins: ' inner join workerInfo w on w.workerID=maintenanceRecords.workerID left join houseInfo h on h.houseID = maintenanceRecords.houseID left join expenseCategories expc on expc.expenseCategoryID = maintenanceRecords.expenseCategoryId ',
    }
};