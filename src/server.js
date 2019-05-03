const WebSocket = require('ws');
const config = require('config');

let ws = new WebSocket.Server({ port: config.remote.port });

function authenticateConnection(req) {
    //TODO
}

ws.on('connection', function (socket, req) {
    authenticateConnection(req)
    socket.on('message', (event) => {
        ws.clients.forEach(c => {
            if (c != socket) 
                c.send(event)
        });
    });
    socket.on('error', logMessage);
});
ws.on('error', logMessage);

function logMessage(event) {
    console.log(event);
}
