const config = require('config');
const ws = config.get('ws');
const actions = config.get('ppActions');

let wsl, wsr;
let propagateEvents = true;

function logMessage(event) {
    console.log(event);
}

function setSlide(path, index) {
    let action = Object.assign({}, actions.triggerSlide);
    action.slideIndex = index;
    action.presentationPath = path;
    if (propagateEvents) 
        wsl.send(JSON.stringify(action));
}

function onMessage(event) {
    const message = JSON.parse(event);
    let text;

    switch(message.action) {
        case 'authenticate':
            text = message.error ? message.error : 'Authenticated';
            break;
        case 'presentationTriggerIndex':
            currentSlide = message.slideIndex;
            currentPresentationPath = message.presentationPath;
            setSlide(currentPresentationPath, currentSlide);
            break;
        default:
            text = JSON.stringify(message);
            break;
    }
}

function authLocal() {
    let action = Object.assign({}, actions.authenticate);
    action.password = ws.local.password;
    wsl.send(JSON.stringify(action));  
}

function authRemote() {
    //TODO
}

module.exports = {

    init: (local, remote) => {
        wsl = local;
        wsr = remote;

        authLocal();
        authRemote();

        wsr.on('message', onMessage);

        wsl.on('error', logMessage);
        wsr.on('error', logMessage);
        wsl.on('close', logMessage);
        wsr.on('close', logMessage);
    },

    getCurrentPlaylist: () => {
        let action = actions.getPlaylists;
        wsl.send(JSON.stringify(action));
    },

    disableEvents: () => {
        propagateEvents = false;
    },
    
    resumeEvents: () => {
        propagateEvents = true;
    },

    disconnect: () => {
        wsl.close();
        wsr.close();
    }
}