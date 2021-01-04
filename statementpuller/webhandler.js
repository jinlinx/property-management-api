const stored = {
    io: null,
    socket: null,
}
function socketEmiter(socket, io) {
    stored.io = io;
    stored.socket = socket;
    socket.on('chat message dbg', function (msg) {
        console.log('got chat msg ' + msg);
        io.emit('chat message dbg', msg + (new Date()).toISOString());
    });

    socket.on('ggFreeFormMsg', msg => {
        socket.broadcast.emit('ggFreeFormMsg', msg);
    })
    socket.on('disconnect', () => {
        console.log('socket disconnect')
    })
    socket.on('connect_failed', function () {
        console.log("Sorry, there seems to be an issue with the connection!");
    })
}

function sendStatus(msg) {
    if (stored.io) {
        stored.io.emit('statementStatus', msg);
    }
}

function askCode(msg, timeout=60000) {
    return new Promise((resolve, reject) => {
        if (stored.io && stored.socket) {
            stored.io.emit('askStatementCode', msg);
            stored.socket.on('receivedStatementCode', msg => {
                resolve(msg);
            });
            if (timeout > 0) {
                setTimeout(() => {
                    reject(new Error('Timeout'));
                }, timeout);
            }
        } else {
            reject(new Error('No socket'));
        }        
    });
}

module.exports = {
    sendStatus,
    socketEmiter,
    askCode,
}