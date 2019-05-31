const config = require('config');
const ws = config.get('ws');
const actions = config.get('ppActions');

let wsl, wsr;
let callback;
let propagateEvents = true;
let filter = [];
let currentSlide = '';
let watching = -1;

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
    let currentPresentationPath, slide;
    switch(message.action) {
        case 'authenticate':
            logMessage(message.error ? message.error : 'Authenticated');
            sendInitState();
            break;
        case 'presentationTriggerIndex':
            currentSlide = message.slideIndex;
            currentPresentationPath = message.presentationPath;
            setSlide(currentPresentationPath, currentSlide);
            break;
        case 'presentationCurrent':
            slide = message.slideIndex ? message.slideIndex : message.presentation.presentationCurrentLocation;
            currentPresentationPath = message.presentationPath;
            if (!!callback) {
                callback(JSON.stringify(message));
            }
            setSlide(currentPresentationPath, slide);
            break;
        case 'presentationSlideIndex':
            slide = message.slideIndex;
            if (slide === -1 && currentSlide != slide) {
                currentSlide = slide;
                getVideoPath();
            }
            break;
        case 'playlistRequestAll':
            if (!!callback) callback(JSON.stringify(message));
            break;
        default:
            logMessage(JSON.stringify(message));
            break;
    }
}

function sendInitState() {
    if (!!callback) {
        let pauseMessage = propagateEvents ? 'resumed' : 'paused';
        callback(JSON.stringify(pauseMessage));

        let watchMessage = watching == -1 ? 'stopped watching' : 'watching...';
        callback(JSON.stringify(watchMessage));

        callback(JSON.stringify({"action":"filters", "filter": filter}));

        callback(JSON.stringify('Connected as master!'));

        getCurrentPlaylist();
    }
}

function getCurrentPlaylist() {
    let action = actions.getPlaylists;
    wsl.send(JSON.stringify(action));

    let action2 = actions.getCurrentPresentation;
    wsl.send(JSON.stringify(action2));
}

function toggleVideoCheck() {
    if (watching == -1) {
        watching = setInterval(checkForVideo, 50);  //this is kludgy - check for a different index to see if it's a video.  if it is, get it's path and send it on to the slaves
        if (!!callback) callback(JSON.stringify('watching...'));
    } else {
        clearInterval(watching);
        watching = -1;
        if (!!callback) callback(JSON.stringify('stopped watching'));
    }
}

function getVideoPath() {
    wsl.send(JSON.stringify(actions.getCurrentPresentation));
}

function checkForVideo() {
    wsl.send(JSON.stringify(actions.getCurrentSlideIndex));
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
        toggleVideoCheck();
    }
}