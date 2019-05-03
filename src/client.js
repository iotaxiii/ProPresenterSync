let ws = new WebSocket('ws:localhost:8080');

function connect() {
    console.log('connecting', ws.readyState);
    if (ws.readyState !== ws.OPEN) ws = new WebSocket('ws:localhost:8080');
};

ws.onopen = (event) => {
    setMessage('Connecting...');
};

ws.onmessage = (event) => {
    console.log(event);
    setMessage(event.data, true);
};

function pause() {
    setMessage('pausing', true);
    ws.send('pause');
}

function resume() {
    setMessage('resuming', true);
    ws.send('resume');
}

function stop() {
    setMessage('disconnecting', true);
    ws.close();
}

function setMessage(message, stringify) {
    message = stringify ? JSON.stringify(message) : message;
    document.getElementById('output').innerText = message
}

document.getElementById('start').addEventListener('click', connect);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('resume').addEventListener('click', resume);
document.getElementById('stop').addEventListener('click', stop);
