module.exports = {
    fields:
        [
            { field: 'houseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'address', desc: 'Address', required: true },
            { field: 'city', desc: 'City', },
            { field: 'state', desc: 'State',  },
            { field: 'zip', desc: 'Zip', },
            { field: 'ownerID', desc: 'Owner ID', require: true, foreignKey: {table: 'ownerInfo', field:'ownerID'} },
        ],
    view:{
        name:'view_house',
        fields:[
            {name:'ownerName', field:'ownerName', desc:'Owner Name', table:'ownerInfo'}
        ],
        content:'select houseID, address, city, state, zip, h.ownerID ownerID, ownerName, h.created, h.modified from houseInfo h left outer join ownerInfo o on h.ownerID=o.ownerID'
    }
};