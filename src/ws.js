const WebSocket = require('ws');
const config = require('config');
const wsconfig = config.get('ws');
const actions = config.get('ppActions');

let wsl; //local
let wsr; //remote
let wss = new WebSocket.Server({ port: 8080 });

let pp = wsconfig.instance.isMaster ? './master.js' : './slave.js';
pp = require(pp);

function connectPP() {
    wsl = new WebSocket('ws://' + wsconfig.local.host + ':' + wsconfig.local.port + '/remote');
    wsr = new WebSocket('ws://' + wsconfig.remote.host + ':' + wsconfig.remote.port);

    wsl.on('open', () => { pp.init(wsl, wsr); });
}

function disconnect() {
    pp.disconnect();
}

function handleClientMessage(event, client) {
    switch (event) {
        case 'pause':
            pp.disableEvents();
            client.send('paused');
            break;
        case 'resume':
            pp.resumeEvents();
            pp.test('1:0', 2);
            client.send('resumed');
            break;
        case 'getPlaylist':
            let playlist = pp.getCurrentPlaylist();
            client.send(JSON.stringify(playlist));
            break;
        default:
            console.log(event);
            break;
    }
}

function logMessage(event) {
    console.log(event);
}

wss.on('connection', function (socket, req) {
    socket.on('message', (event) => handleClientMessage(event, socket));
    socket.on('close', disconnect);
    socket.on('error', logMessage);
    console.log('web client connected', req.connection.remoteAddress);
    socket.send('Connected!');
    connectPP();
});
wss.on('error', logMessage);


