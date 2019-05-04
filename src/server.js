const WebSocket = require('ws');
const config = require('config');
const fs = require('fs');
const https = require('https');
const remote = config('ws.remote');

const server = https.createServer({
   cert: fs.readFileSync(remote.certPath),
   key: fs.readFileSync(remote.keyPath),
   port: remote.port
});

let ws = new WebSocket.Server({ server });

function authenticateConnection(req) {

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
