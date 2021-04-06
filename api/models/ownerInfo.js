module.exports = {
    fields:
        [
            { field: 'ownerID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'ownerName', desc: 'Owner Name', required: true },
            { field: 'shortName', desc: 'Short Name', require: true },
            { field: 'vdPosControl', desc:'PosControl'},
        ]
};