module.exports = {
    fields:
        [
            { field: 'id', desc: 'Id', type: 'uuid', isId: true, },
            { field: 'tenantID', desc: 'Tenant Id', type: 'uuid', required: true, foreignKey: { table: 'tenantInfo', field: 'tenantID' } },            
            { field: 'leaseID', desc: 'Lease ID', required: true, foreignKey: { table: 'leaseInfo', field: 'leaseID' } },
            { field: 'userID', type: 'int', desc: 'Owner', foreignKey: { table: 'userInfo', field: 'userID' }, required: true, def:'0', isOwnerSecurityField: true,},
        ],
        view:{
            name: 'view_leaseTenantInfo',
            fields:[
                { name: 'comment', field: 'comment', desc: 'Lease Comment', table: 'l' },
                { name: 'address', field: 'address', desc: 'House', table: 'h' },

                { field: 'firstName', desc: 'First Name', table:'tenantInfo' },
                { field: 'lastName', desc: 'Last Name', table:'tenantInfo' },
                { field: 'email', desc: 'Email', table:'tenantInfo' },
                { field: 'phone', desc: 'Phone', table:'tenantInfo' },
            ], 
            extraViewJoins: ' left join tenantInfo t on t.tenantID=leaseTenantInfo.tenantID inner join leaseInfo l on l.leaseID=leaseTenantInfo.leaseID left join houseInfo h on h.houseID=l.houseID',
        }
};