const config = require('config');
const ws = config.get('ws');
const actions = config.get('ppActions');

let wsl, wsr;
let callback;
let propagateEvents = true;
let filter = [];

function logMessage(event) {
    console.log(event);
}

function setSlide(path, index) {
    let action = Object.assign({}, actions.triggerSlide);
    action.slideIndex = index;
    action.presentationPath = path;
    if (propagateEvents && !filter.includes(path)) 
        wsr.send(JSON.stringify(action));
}

function authLocal() {
    let action = Object.assign({}, actions.authenticate);
    action.password = ws.local.password;
    wsl.send(JSON.stringify(action));  
}

function onMessage(event) {
    const message = JSON.parse(event);

    switch(message.action) {
        case 'authenticate':
            logMessage(message.error ? message.error : 'Authenticated');
            break;
        case 'presentationTriggerIndex':
            currentSlide = message.slideIndex;
            currentPresentationPath = message.presentationPath;
            if (!!callback) callback(JSON.stringify(message));
            setSlide(currentPresentationPath, currentSlide);
            break;
        case 'playlistRequestAll':
            if (!!callback) callback(JSON.stringify(message));
            break;
        default:
            logMessage(JSON.stringify(message));
            break;
    }
}

function getCurrentPlaylist() {
    let action = actions.getPlaylists;
    wsl.send(JSON.stringify(action));
}

module.exports = {
    init: (local, remote, cb) => {
        wsl = local;
        wsr = remote;

        authLocal();

        wsl.on('message', onMessage);

        wsl.on('error', logMessage);
        wsr.on('error', logMessage);
        wsl.on('close', logMessage);
        wsr.on('close', logMessage);
        
        callback = cb;
        getCurrentPlaylist();
    },

    disableEvents: () => {
        propagateEvents = false;
    },
    
    resumeEvents: () => {
        propagateEvents = true;
    },

    disconnect: () => {
        if (wsl) wsl.close();
        if (wsr) wsr.close();
    },

    modifyFilter: (name, location, action) => {
        if (action === 'add') {
            if (!filter.includes(location)) {
                filter.push(location);
            }
        } else {
            let index = filter.indexOf(location);
            if (index >= 0)
                filter.splice(index, 1);
        }
    }
}