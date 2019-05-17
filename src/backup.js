const WebSocket = require('ws');

const actions = require('./proPresenterRemoteActions.json');

let wsl; //local
let wsr; //remote
let wss = new WebSocket.server({ port: 8080 });

let currentSlide = 1;
let currentPresentationPath = '';
let propagateEvents = true;


export function connect() {
    wsl = new WebSocket('ws://' + actions.local.host + ':' + actions.local.port + '/remote');
    //wsr = new WebSocket('ws://' + actions.remote.host + ':' + actions.remote.port);

}

export function disableEvents() {
    propagateEvents = false;
}

export function resumeEvents() {
    propagateEvents = true;
}

export function disconnect() {
    wsl.disconnect();
    wsr.disconnect();
}

wss.onopen(function (event) {
    console.log('web client connected');
});

wss.onerror = logError;

wss.onmessage = function(event) {
    const message = event.data;
    console.log(message);
}

wsl.onclose = function(event) {
    console.log(event);
    //TODO actual handling
}

function logError(event) {
    console.log(event);
}

wsl.onerror = logError;

wsl.onopen = function(event) {
    let action = actions.authenticate;
    action.password = config.local.password;
    ws.send(JSON.stringify(actions.authenticate));
}

wsl.onmessage = function(event) {
    const message = JSON.parse(event.data);

    let text;

    switch(message.action) {
        case 'authenticate':
        text = message.error ? message.error : 'Authenticated';
        break;

        case 'presentationSlideIndex':
        currentSlide = message.slideIndex;
        text = JSON.stringify(message.slideIndex);
        break;

        case 'presentationCurrent':
        currentPresentationPath = message.presentationPath;
        text = JSON.stringify(message);
        break;

        case 'presentationTriggerIndex':
        currentSlide = message.slideIndex;
        currentPresentationPath = message.presentationPath;
        text = JSON.stringify(message);
        break;

        default:
        text = JSON.stringify(message);
        break;
    }

    console.log(text);
}


export function next() {
    let action = actions.triggerSlide;
    action.slideIndex = 1 + Number.parseInt(currentSlide);
    action.presentationPath = currentPresentationPath;
    wsl.send(JSON.stringify(action));
}

export function getCurrentPresentation() {
    wsl.send(JSON.stringify(actions.getCurrentPresentation));
}

export function getCurrentIndex() {
    wsl.send(JSON.stringify(actions.getCurrentSlideIndex));
}

