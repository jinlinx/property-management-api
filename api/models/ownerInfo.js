module.exports = {
    fields:
        [
            { field: 'ownerID', desc: 'Id', type: 'ident', required: true, isId: true },
            { field: 'ownerName', desc: 'Owner Name', required: true, },
            { field: 'username', desc: 'username', required: true, unique: true, },
            { field: 'password', desc:'Password', required: false },
            { field: 'shortName', desc: 'Short Name', require: true },
        ]
};