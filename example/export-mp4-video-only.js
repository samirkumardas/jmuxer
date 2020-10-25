const fs = require('fs');
const { Readable } = require('stream');
const JMuxer = require('./jmuxer.min');
const jmuxer = new JMuxer({
    mode: 'video',
    fps: 30,
    debug: true
});
const mp4Reader = new Readable({
    objectMode: true,
    read(size) {
    }
});

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
function simulateChunk() {
    end = chunks[current];
    chunk = buffer.slice(start, end);
    start = end;
    current++;
    mp4Reader.push({
        video: chunk
    });
    if (current < total) {
        setTimeout(simulateChunk, 0);
    } else {
        jmuxer.destroy();
        process.exit();
    }
}

let buffer = fs.readFileSync('./demo.h264');
let chunks = extractChunks(buffer);
let total = chunks.length;
mp4Reader.pipe(jmuxer.toStream());
simulateChunk();