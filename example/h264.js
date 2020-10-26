const WebSocket = require('ws');
const fs = require('fs');
const PORT = process.env.PORT || 8080;
let minNaluPerChunk = 30,
    interval = 0,
    current = 0,
    start = 0,
    end = 0,
    wss;
function extractChunks(buffer) {
    let i = 0,
        length = buffer.byteLength,
        naluCount = 0,
        value,
        unit,
        ntype,
        state = 0,
        lastIndex = 0,
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
                    if (lastIndex) {
                        unit = buffer.slice(lastIndex, i - state -1);
                        ntype = unit[0] & 0x1f;
                        naluCount++;
                    }
                    if (naluCount >= minNaluPerChunk && ntype !== 1 && ntype !== 5) {
                        result.push(lastIndex - state -1);
                        naluCount = 0;
                    }
                    state = 0;
                    lastIndex = i;
                } else {
                    state = 0;
                }
                break;
            default:
                break;
        }
    }
    if (naluCount > 0) {
        result.push(lastIndex);
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

function writeChunk() {
    for (i = 0; i < chunks.length; i++) {
        end = chunks[i];
        chunk = buffer.slice(start, end);
        start = end;
        fs.writeFile("./h264/" + i + '.h264', chunk,  "binary", function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}
//writeChunk();

function sendChunk() {
    let anybodyThere = false;
    if (current >= total) {
        current = 0;
        start = 0;
    }
    end = chunks[current];
    current++;
    wss.clients.forEach(function each(client) {
        let chunk;
        if (client.readyState === WebSocket.OPEN) {
            anybodyThere = true;
            chunk = buffer.slice(start, end);
            start = end;
            try {
                client.send(chunk);
            } catch(e) {
               console.log(`Sending failed:`, e); 
            }
            if (current % 50 == 0) {
                 console.log(`I am serving, no problem!`);
            }
            if (current == 0) {
                 console.log(`Started from first chunk...`);
            }
        }
    });

    if (!anybodyThere) {
        if (interval) {
            current = start = end = 0;
            clearInterval(interval);
            console.log('nobody is listening. Removing interval for now...');
        }
    }
}
openSocket();