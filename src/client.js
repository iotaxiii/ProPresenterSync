const url = 'ws:localhost:8080';

let ws = new WebSocket(url);

let state = 0; 
const states = {"Resumed": 0, "Paused": 1};
let playlists;
let currentPlaylist;

function connect() {
    console.log('connecting', ws.readyState);
    if (ws.readyState !== ws.OPEN) {
        ws = new WebSocket(url);
        
        ws.onopen = onopen;
        ws.onmessage = onmesage;
    }
};

function onopen(event) {
    setMessage('Connecting...');
}

function onmesage(event) {
    try {
        
        let json = JSON.parse(event.data);
        switch (json.action) {
            case 'playlistRequestAll':
                playlists = json.playlistAll;
                loadPlaylists();
                break;
            case 'presentationTriggerIndex':
                currentPlaylist = Number.parseInt(json.presentationPath.split(':')[0]);
                loadPlaylists()
                break;
            default:
                setMessage(json, true);
        }
    } catch (ex) {
        console.log(ex);
        setMessage(event.data, true);
    }
}

ws.onopen = onopen;
ws.onmessage = onmessage;

function pause() {
    setMessage('pausing', true);
    ws.send(JSON.stringify({action:'pause'}));
}

function resume() {
    setMessage('resuming', true);
    ws.send(JSON.stringify({action:'resume'}));
}

function stop() {
    setMessage('disconnecting', true);
    ws.close();
}

function setMessage(message, stringify) {
    message = stringify ? JSON.stringify(message) : message;
    document.getElementById('output').innerText = message
}

function statusCheck() {
    connect();
}

function setButtonStates() {
    //TODO
}

function loadPlaylists() {
    if (playlists == undefined || currentPlaylist == undefined)
        return;

    let playlist = playlists[currentPlaylist];
    let sections = playlist.playlist;
    let names = sections.map(s => [s.playlistItemName, s.playlistItemLocation]);
    let playlistDiv = document.getElementById('currentPlaylist');
    let checkboxes = names.map(n => '<input type="checkbox" name="' + n[0] + '" location="' + n[1] + '" checked>' + n[0] + '</input>').join('<br>');
    playlistDiv.innerHTML = checkboxes;
    
}

function changePlaylistActiveState(e) {
    let filterAction = e.srcElement.checked ? 'remove' : 'add';
    ws.send(JSON.stringify({'filter': filterAction, 'action': 'filter', 'name': e.srcElement.name, 'location': e.srcElement.attributes.location.value}))
}

document.getElementById('start').addEventListener('click', connect);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('resume').addEventListener('click', resume);
document.getElementById('stop').addEventListener('click', stop);
document.getElementById('currentPlaylist').addEventListener('change', changePlaylistActiveState);
setInterval(statusCheck, 10000);
