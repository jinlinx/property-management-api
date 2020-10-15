const {formatterYYYYMMDD}=require('../util/util');
const formatter=formatterYYYYMMDD;
module.exports = {
    fields:
        [
            { field: 'leaseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'deposit', desc: 'Deposit',  },
            { field: 'endDate', desc: 'End Date', formatter},
            { field: 'startDate', desc: 'Start Date',  formatter},
            { field: 'houseID', desc: 'House ID', foreignKey: {table: 'houseInfo', field:'houseID'}},
            { field: 'comment', desc: 'Comment' },
            { field: 'monthlyRent', desc: 'Monthly Rent', require: true, type: 'decimal', },
        ],
        view:{
            name:'view_leaseInfo',
            fields:[
                { name: 'houseAddress', field: 'address', desc: 'Address', table: 'houseInfo' },
                { name: 'houseZip', field:'zip', desc:'Zip', table:'houseInfo'}
            ],
            //content:'select houseID, address, city, state, zip, h.ownerID ownerID, ownerName, h.created, h.modified from houseInfo h left outer join ownerInfo o on h.ownerID=o.ownerID'
        }
};