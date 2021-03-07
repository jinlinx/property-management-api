const {formatterYYYYMMDD}=require('../util/util');
const formatter=formatterYYYYMMDD;
module.exports = {
    fields:
        [
            { field: 'leaseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'deposit', desc: 'Deposit',  },
            { field: 'endDate', desc: 'End Date', formatter, type: 'date'},
            { field: 'startDate', desc: 'Start Date',  formatter, type: 'date'},
            { field: 'houseID', desc: 'House ID', foreignKey: {table: 'houseInfo', field:'houseID'}},
            { field: 'comment', desc: 'Comment' },
            { field: 'monthlyRent', desc: 'Monthly Rent', require: true, type: 'decimal', },
        ],
        view:{
            name:'view_leaseInfo',
            fields:[
                { field: 'houseAddress', name: 'address', desc: 'Address', table: 'houseInfo' },
                { field: 'houseZip', name:'zip', desc:'Zip', table:'houseInfo'}
            ],
            //content:'select houseID, address, city, state, zip, h.ownerID ownerID, ownerName, h.created, h.modified from houseInfo h left outer join ownerInfo o on h.ownerID=o.ownerID'
        }
};