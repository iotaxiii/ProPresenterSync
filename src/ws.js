const WebSocket = require('ws');
const config = require('config');
const https = require('https');
const fs = require('fs');
const wsconfig = config.get('ws');
const actions = config.get('ppActions');
const remote = config.get('ws.remote');

let wsl; //local - pro presenter
let wsr; //remote - intermediate server
let wss = new WebSocket.Server({ port: 8080 }); // server for web page

// determine if instance is a master or a slave
// if master/slave arg is passed in use it, otherwise use config
const args = process.argv;
const masterArg = args[2] ? args[2] === 'master' : wsconfig.instance.isMaster; 
let pp = masterArg ? './master.js' : './slave.js';
pp = require(pp);

//we only have a self-signed cert so we need to reduce security of  but still want to verify the endpoint
const caCert = fs.readFileSync(remote.certPath);
const agent = new https.Agent({ 
    rejectUnauthorized: false,
    ca: [caCert]
});

const auth = remote.auth;

function connectPP() {
    wsl = new WebSocket('ws://' + wsconfig.local.host + ':' + wsconfig.local.port + '/remote');
    wsr = new WebSocket(
        'wss://' + wsconfig.remote.host + ':' + wsconfig.remote.port, 
        {
            agent, //pass agent allowing insecure (self-signed) certs but expecting a specific cert (the one the server uses)
            headers: {
                Authorization: auth
            }
        }
    ); 

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
            client.send('resumed');
            break;
        case 'getPlaylist':
            let playlist = pp.getCurrentPlaylist();
            client.send(JSON.stringify(playlist));
            break;
        default:
            logMessage(event);
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
    logMessage('web client connected', req.connection.remoteAddress);
    socket.send('Connected as ' + (masterArg ? 'master!' : 'slave!'));
    connectPP();
});
wss.on('error', logMessage);


