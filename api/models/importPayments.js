module.exports = {
    fields:
        [
            { field: 'id', desc: 'Id' },
            { field: 'date', desc: 'Date', type: 'date' },
            { field: 'amount', desc: 'Amount', type: 'decimal' },
            { field: 'name', desc: 'Name', },
            { field: 'notes', desc: 'Notes', },
            { field: 'source', desc: 'source', },

            { field: 'tenantID', desc: 'tenantID', },
            { field: 'leaseID', desc: 'leaseID', },
            { field: 'houseID', desc: 'houseID', },
            { field: 'ownerID', type: 'int', desc: 'Owner ID', required: true, foreignKey: { table: 'ownerInfo', field: 'ownerID' } },
            { field: 'ownerName', desc: 'Owner Name', },
            { field: 'address', desc: 'Address', },
            { field: 'importID', desc: 'Temp ImportId', },
            { field: 'paymentID', desc: 'Temp PaymentId', },
            { field: 'matchedTo', desc: 'Matched To' },
            { field: 'deleted', desc: 'Deleted' },
            { field: 'vdPosControl', desc: 'PosControl' },
        ]        
};