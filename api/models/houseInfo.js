module.exports = {
    fields:
        [
            { field: 'houseID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'address', desc: 'Address', required: true },
            { field: 'city', desc: 'City', },
            { field: 'state', desc: 'State',  },
            { field: 'zip', desc: 'Zip', },
            { field: 'ownerID', desc: 'Owner ID', require: true, , foreignKey: {table: 'ownerInfo', field:'ownerID'} },
        ]
};