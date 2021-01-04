const { isUndefined } = require('lodash');
const socketio = require('socket.io');
const consts = require('./consts');
function setupSocket(server, setupFuncs) {
    //moved server.server to 8082
    const io = require('socket.io')(8082, {
        transports: ['websocket'],
        path: `${consts.apiRoot}/socket.io`,
    });
    io.use((socket, next) => {
        console.log('socket io use')        
        next();
    });
    //const io = baseIo.of(consts.apiRoot);
    io.on('connection', function (socket) {
        console.log('connection');
        setupFuncs.forEach(ssetup=>{
            if (typeof ssetup === 'function')
                ssetup(socket, io);
        })
        //socket.on('chat message', function (msg) {
        //    console.log('got chat msg ' + msg);
        //    io.emit('chat message srv', msg + (new Date()).toISOString());
        //});
    });
}

module.exports = {
    setupSocket,
}