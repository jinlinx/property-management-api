module.exports={
    fields:
        [
            {field: 'id', desc: 'Id', type: 'uuid', isId: true, },
            {field: 'workerID', desc: 'Id', type: 'uuid', required: true, foreignKey: {table: 'workerInfo', field: 'workerID'}},
            { field: 'dayOfMonth', desc: 'Day of Month to process' },
            {field: 'type', desc: 'Percent or amount'},
            {field: 'amount', desc: 'Percent', type: 'decimal'},
            {field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field: 'leaseID'}},
        ],
        view:{
            name:'view_workerComp',
            fields:[
                { name: 'firstName', field: 'firstName', desc: 'Worker Firstname', table: 'workerInfo' },
                { name: 'lastName', field: 'lastName', desc: 'Worker Lastname', table: 'workerInfo' },
                { name: 'comment', field: 'comment', desc: 'Lease Comment', table: 'leaseInfo' },
                { field: 'address', desc: 'Address', table: 'h' },
            ],  
            extraViewJoins: ' left join houseInfo h on h.houseID = leaseInfo.houseID ',
        }
};