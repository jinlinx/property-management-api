module.exports = {
    fields:
        [
            { field: 'paymentTypeID', desc: 'Id' ,required: true, isId: true},
            { field: 'paymentTypeName', desc: 'date' },
            { field: 'includeInCommission', desc: 'includeInCommission' },
            { field: 'displayOrder', type:'int' }, 
        ]
};