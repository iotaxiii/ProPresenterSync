const config = require('config');
const ws = config.get('ws');
const actions = config.get('ppActions');

let wsl, wsr;
let callback;
let propagateEvents = true;
let filter = [];
let watching = -1;

function logMessage(event) {
    console.log(event);
}

function setSlide(path, index) {
    let action = Object.assign({}, actions.triggerSlide);
    action.slideIndex = index;
    action.presentationPath = path;
    if (propagateEvents && !filter.includes(path)) 
        wsl.send(JSON.stringify(action));
}

function onMessage(event) {
    const message = JSON.parse(event);
    switch(message.action) {
        case 'presentationTriggerIndex':
            currentSlide = message.slideIndex;
            currentPresentationPath = message.presentationPath;
            if (!!callback) callback(JSON.stringify(message));
            setSlide(currentPresentationPath, currentSlide);
            break;
        default:
            text = JSON.stringify(message);
            break;
    }
}

function onLocal(event) {
    const message = JSON.parse(event);
    switch(message.action) {
        case 'authenticate':
            logMessage(message.error ? message.error : 'Authenticated');
            sendInitState();
            getCurrentPlaylist();
            break;
        case 'playlistRequestAll':
            if (!!callback) callback(JSON.stringify(message));
            break;
        case 'presentationCurrent':
            slide = message.slideIndex ? message.slideIndex : message.presentation.presentationCurrentLocation;
            currentPresentationPath = message.presentationPath;
            if (!!callback) {
                callback(JSON.stringify(message));
            }
            break;
        default:
            break;
    }
}

function authLocal() {
    let action = Object.assign({}, actions.authenticate);
    action.password = ws.local.password;
    wsl.send(JSON.stringify(action));  
}

function getCurrentPlaylist() {
    let action = actions.getPlaylists;
    wsl.send(JSON.stringify(action));

    let action2 = actions.getCurrentPresentation;
    wsl.send(JSON.stringify(action2));
}

function sendInitState() {
    if (!!callback) {
        let pauseMessage = propagateEvents ? 'resumed' : 'paused';
        callback(JSON.stringify(pauseMessage));

        let watchMessage = watching == -1 ? 'stopped watching' : 'watching...';
        callback(JSON.stringify(watchMessage));

        callback(JSON.stringify({"action":"filters", "filter": filter}));

        callback(JSON.stringify('Connected as slave!'));
    }
}

module.exports = {

    init: (local, remote, cb) => {
        wsl = local;
        wsr = remote;
        callback = cb;

        authLocal();

        wsr.on('message', onMessage);
        wsl.on('message', onLocal);

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
    },

    watch: () => {
        if (!!callback) callback(JSON.stringify('slaves do not trigger videos'));
    }
}