module.exports = {
    fields:
        [
            { field: 'tenantID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'name', desc: 'Name', required: true },
            { field: 'source', desc: 'Source', require: true },
            { field: 'vdPosControl', desc: 'PosControl' },
        ]
};