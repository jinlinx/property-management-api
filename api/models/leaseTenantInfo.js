module.exports = {
    fields:
        [
            { field: 'id', desc: 'Id', type: 'uuid', isId: true, },
            { field: 'tenantID', desc: 'Tenant Id', type: 'uuid', required: true, foreignKey: { table: 'tenantInfo', field: 'tenantID' } },            
            { field: 'leaseID', desc: 'Lease ID', required: true, foreignKey: { table: 'leaseInfo', field: 'leaseID' } },
        ],
};