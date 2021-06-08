module.exports = {
    fields:
        [
            { field: 'id', desc: 'Id' },
            { field: 'source', desc: 'Source'},
            { field: 'start', desc: 'End', type: 'datetime' },
            { field: 'end', desc: 'End', type:'datetime'},
            { field: 'msg', desc: 'Message', size: 4096},
            { field: 'vdPosControl', desc: 'PosControl' },
        ]
};