const WebSocket = require('ws');
const fs = require('fs');

const rawChunks = './raw/';
const PORT = process.env.PORT || 8080;
let chunks = [],
    interval = 0,
    total = 0,
    current = 0,
    wss;

fs.readdir(rawChunks, (err, files) => {
    /* bit crazy here :) */
    files = files.filter(file => file.indexOf('.txt') !== -1);
    files = files.map(file => parseInt(file));
    files.sort((a, b) => a - b);
    files.forEach((file) => {
        fs.readFile(rawChunks+file+'.txt', (err, data) => {
            if (err) throw err;
            chunks.push(data);
            total++;
            if (files.length == total) {
                openSocket();
            }
        });
    });
});


function openSocket() {
    wss = new WebSocket.Server({ port: PORT });
    console.log('Server ready on port '+PORT);
    wss.on('connection', function connection(ws) {
          console.log('Socket connected. sending data...');
          if (interval) {
              clearInterval(interval);
          }
          interval = setInterval(function() {
            sendChunk();
          }, 1800);
    });
}

function sendChunk() {
    let chunk,
        anyOneThere = false;
    chunk = chunks[current];
    current++;
    if (current == total) current = 0;
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            anyOneThere = true;
            client.send(chunk);
            if (current % 50 == 0){
                 console.log(`I am serving, no problem!`);
            }
        }
    });

    if (!anyOneThere) {
        if (interval) {
            current = 0;
            clearInterval(interval);
            console.log('nobody is listening. Removing interval for now...');
        }
    }
}