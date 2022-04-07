
module.exports = {
    fields:
        [
            { field: 'leaseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'deposit', desc: 'Deposit', type: 'decimal' },
            { field: 'petDeposit', desc: 'Pet Deposit', type: 'decimal', def: 0 },
            { field: 'otherDeposit', desc: 'Other Deposit',  type: 'decimal', def: 0 },
            { field: 'endDate', desc: 'End Date',  type: 'date'},
            { field: 'startDate', desc: 'Start Date',  type: 'date'},
            { field: 'houseID', desc: 'House ID', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'ownerID', type: 'int', desc: 'Owner', foreignKey: { table: 'ownerInfo', field: 'ownerID' }, required: true, def:'0', isOwnerSecurityField: true,},
            { field: 'comment', desc: 'Comment' },
            { field: 'monthlyRent', desc: 'Monthly Rent', required: true, type: 'decimal', },            
        ],
        view:{
            name:'view_leaseInfo',
            fields:[
                { field: 'address', name: 'houseAddress', desc: 'Address', table: 'houseInfo' },
                { field: 'zip', name:'houseZip', desc:'Zip', table:'houseInfo'}
            ],
            //content:'select houseID, address, city, state, zip, h.ownerID ownerID, ownerName, h.created, h.modified from houseInfo h left outer join ownerInfo o on h.ownerID=o.ownerID'
        }
};