const WebSocket = require('ws');
const fs = require('fs');

const PORT = process.env.PORT || 8080;
let naluPerChunk = 30,
    interval = 0,
    current = 0,
    start = 0,
    end = 0,
    wss;

function extractChunks(buffer) {
    let i = 0,
        length = buffer.byteLength,
        nuluCount = 0,
        value,
        state = 0,
        result = [];

    while (i < length) {
        value = buffer[i++];
        // finding 3 or 4-byte start codes (00 00 01 OR 00 00 00 01)
        switch (state) {
            case 0:
                if (value === 0) {
                    state = 1;
                }
                break;
            case 1:
                if (value === 0) {
                    state = 2;
                } else {
                    state = 0;
                }
                break;
            case 2:
            case 3:
                if (value === 0) {
                    state = 3;
                } else if (value === 1 && i < length) {
                    nuluCount++;
                    if (nuluCount === naluPerChunk) {
                        result.push(i);
                        nuluCount = 0;
                    }
                    state = 0;
                } else {
                    state = 0;
                }
                break;
            default:
                break;
        }
    }

    return result;
}

let buffer = fs.readFileSync('./demo.h264');
let chunks = extractChunks(buffer);
let total = chunks.length;

function openSocket() {
    wss = new WebSocket.Server({ port: PORT });
    console.log('Server ready on port '+PORT);
    wss.on('connection', function connection(ws) {
          console.log('Socket connected. sending data...');
          if (interval) {
              clearInterval(interval);
          }
          ws.on('error', function error(error) {
              console.log('WebSocket error');
          });
          ws.on('close', function close(msg) {
              console.log('WebSocket close');
          });

          interval = setInterval(function() {
            sendChunk();
          }, 800);
    });
}

function sendChunk() {
    let anyOneThere = false;

    end = chunks[current];
    current++;
    if (current == total) current = 0;

    wss.clients.forEach(function each(client) {
        let chunk;
        if (client.readyState === WebSocket.OPEN) {
            anyOneThere = true;
            chunk = buffer.slice(start, end);
            start = end;
            try {
                client.send(chunk);
            } catch(e) {
               console.log(`Sending failed:`, e); 
            }
            if (current % 50 == 0){
                 console.log(`I am serving, no problem!`);
            }
        }
    });

    if (!anyOneThere) {
        if (interval) {
            current = start = end = 0;
            clearInterval(interval);
            console.log('nobody is listening. Removing interval for now...');
        }
    }
}

openSocket();