const stored = {
    io: null,
}
function socketEmiter(socket, io) {
    stored.io = io;
    socket.on('chat message dbg', function (msg) {
        console.log('got chat msg ' + msg);
        io.emit('chat message dbg', msg + (new Date()).toISOString());
    });
}

function sendStatus(msg) {
    if (stored.io) {
        stored.io.emit('statementStatus', msg);
    }
}

module.exports = {
    sendStatus,
    socketEmiter,
}