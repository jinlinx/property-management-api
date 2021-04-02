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
            { field: 'ownerID', desc: 'Owner ID', },
            { field: 'ownerName', desc: 'Owner Name', },
            { field: 'address', desc: 'Address', },
            { field: 'importID', desc: 'Temp ImportId', },
            //{ field: 'paymentID', desc: 'Temp PaymentId', },
            { field: 'matchedTo', desc: 'Matched To' },
            { field: 'deleted', desc: 'Deleted' },
        ]        
};