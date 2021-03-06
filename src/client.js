const url = 'ws:localhost:8080';

let ws;// = new WebSocket(url);

let state = 0; 
const states = {"Resumed": 0, "Paused": 1};
let playlists;
let currentPlaylist;
let filter = [];

function connect() {
    if (ws == undefined || ws.readyState !== ws.OPEN) {
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
                break;
            case 'presentationCurrent':
                currentPlaylist = Number.parseInt(json.presentationPath.split(':')[0]);
                loadPlaylists()
                break;
            case 'filters':
                filter = json.filter;
                break;
            default:
                setMessage(json, true);
        }
    } catch (ex) {
        console.log(ex);
        setMessage(event.data, true);
    }
}

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

function watch() {
    setMessage('toggling watch', true);
    ws.send(JSON.stringify({action:'watch'}));
}

function setMessage(message, stringify) {
    message = stringify ? JSON.stringify(message) : message;
    setButtonStates(message);
    document.getElementById('output').innerText = message
}

function statusCheck() {
    connect();
}

function setButtonStates(message) {
    switch (message) {
        case '"watching..."':
            document.getElementById('watch').innerText = 'Stop Watching';
            break;
        case '"stopped watching"':
            document.getElementById('watch').innerText = 'Watch';
            break;
        case '"paused"':
            document.getElementById('pause').style.display = 'none';
            document.getElementById('resume').style.display = '';
            break;
        case '"resumed"':
            document.getElementById('resume').style.display = 'none';
            document.getElementById('pause').style.display = '';
            break;
        case '"disconnecting"':
            document.getElementById('stop').style.display = 'none';
            document.getElementById('start').style.display = '';
            cleanPlaylists();
            break;
        case '"Connected as master!"':
        case '"Connected as slave!"':
            document.getElementById('start').style.display = 'none';
            document.getElementById('stop').style.display = '';
            break;
        default:
            console.log(message);
            break;
    }
}

function cleanPlaylists() {
    playlists = undefined;
    currentPlaylist = undefined;
    document.getElementById('currentPlaylist').innerHTML = '';
}

function loadPlaylists() {
    if (playlists == undefined || currentPlaylist == undefined)
        return;
    
    let playlistDiv = document.getElementById('currentPlaylist');
    if (playlistDiv.innerHTML != '') 
        return;

    let playlist = playlists[currentPlaylist];
    let sections = playlist.playlist;
    let names = sections.map(s => [s.playlistItemName, s.playlistItemLocation, s.playlistItemType]);
    let filtered = names.filter(n => n[2] != 'playlistItemTypeHeader')
    const divs = '<div class="input-group"><div class="input-group-prepend w-100"><div class="input-group-text w-100">';
    const endDivs = '</div></div></div>';
    let checkboxes = filtered.map(n => divs + 
        '<input type="checkbox" ' + 
        (filter.includes(n[1]) ? '' : 'checked') + 
        ' name="' + n[0] + 
        '" location="' + n[1] + 
        '">' + n[0] + 
        '</input>' + endDivs
    );
    playlistDiv.innerHTML = checkboxes.join('');
}

function changePlaylistActiveState(e) {
    let filterAction = e.srcElement.checked ? 'remove' : 'add';
    ws.send(JSON.stringify({'filter': filterAction, 'action': 'filter', 'name': e.srcElement.name, 'location': e.srcElement.attributes.location.value}))
}

document.getElementById('start').addEventListener('click', connect);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('resume').addEventListener('click', resume);
document.getElementById('stop').addEventListener('click', stop);
document.getElementById('watch').addEventListener('click', watch);
document.getElementById('currentPlaylist').addEventListener('change', changePlaylistActiveState);
setInterval(statusCheck, 10000);
connect();
