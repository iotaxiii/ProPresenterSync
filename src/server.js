const WebSocket = require('ws');
const config = require('config');
const fs = require('fs');
const https = require('https');
const remote = config.get('ws.remote');

const server = https.createServer({
   cert: fs.readFileSync(remote.certPath),
   key: fs.readFileSync(remote.keyPath)
});

const expectedAuth = remote.auth;

let ipFilter = {}; //ip: failedAttempts
const attemptLimit = remote.authRetryLimit;

let ws = new WebSocket.Server({ 
    server,
    verifyClient: function(info) {
        console.log(info.origin);
        let ip = info.req.connection.remoteAddress;
        let attempts = ipFilter[ip] || 0;
        if (attempts >= attemptLimit) {
            return false;
        } 
        
        let auth = info.secure && info.req.headers.authorization === expectedAuth;
        if (!auth) ipFilter[ip] = ++attempts;

        return auth;
    }
});

ws.on('connection', function (socket, req) {
    socket.on('message', (event) => {
        logMessage(event);
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

server.listen(remote.port);
console.log('server listening on port:', remote.port);
