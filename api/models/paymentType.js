module.exports = {
    fields:
        [
            { field: 'paymentTypeID', desc: 'Id' , type: 'int', required: true, isId: true},
            { field: 'paymentTypeName', desc: 'date' },
            { field: 'isIncome', desc: 'isIncome' },
            { field: 'displayOrder', type:'int' }, 
        ]
};