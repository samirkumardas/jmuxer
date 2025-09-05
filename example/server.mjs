/**
 * The following two demos are essentially very similar
 * 
 * 1. Raw chunks from server, client does the muxing
 * The advantage of the first demo is that 
 * the server does very minimal processing,
 * it merely pushes the raw h264 chunks to
 * the client.
 * The client then, with the help of JMuxer,
 * muxes them into a fMP4 stream to display.
 * This allows maximum flexibility
 * and it means that a single indentical
 * raw H264 stream could feed many clients.
 * The downside is that to stream both video
 * and audio, some sort of custom encoding is
 * required (eg. using socket.io).
 * 
 * 2. Muxed by server, fMP4 streamed from server
 * This has the advantage of requiring very little
 * to be done on the client, and this stream could
 * also be just streamed over standard HTTP and most
 * client like browsers, but also IPTV, would be
 * able to display it without issues.
 * The main downside to this approach is that the
 * sever needs to generate a "custom" stream for
 * each, meaning a lot more load for the server.
 * 
 * 
 * Both are perfectly valid approaches, it just
 * depends on your usecase and needs.
 */






import express from "express";
import expressWs from "express-ws";
import fs from "fs/promises";
import JMuxer from "./jmuxer.min.js";

const app = express();
expressWs(app);

app.use(express.static('.'));

const PORT = process.env.PORT || 8080;
const minNaluPerChunk = 30

const bufferH264 = await fs.readFile('./demo.h264');
const chunksH264 = extractChunks(bufferH264);

const bufferH265 = await fs.readFile('./demo.h265');
const chunksH265 = extractChunks(bufferH265);

app.ws('/', async (ws, req) => {
    let current = 0;

    const sendChunk = async () => {
        const chunk = bufferH264.slice(current == 0 ? 0 : chunksH264[current - 1], chunksH264[current]);
        current = (current + 1) % chunksH264.length;
        ws.send(chunk);
    }

    const interval = setInterval(function() {
        sendChunk();
    }, 1500);

    ws.on('close', () => {
        console.log('Socket closed, stopping stream');
        clearInterval(interval);
    });

    ws.on('error', (err) => {
        console.log('Socket error, stopping stream', err);
        clearInterval(interval);
    });
});

app.ws('/H265', async (ws, req) => {
    let current = 0;

    const sendChunk = async () => {
        const chunk = bufferH265.slice(current == 0 ? 0 : chunksH265[current - 1], chunksH265[current]);
        current = (current + 1) % chunksH265.length;
        ws.send(chunk);
    }

    const interval = setInterval(function() {
        sendChunk();
    }, 1500);

    ws.on('close', () => {
        console.log('Socket closed, stopping stream');
        clearInterval(interval);
    });

    ws.on('error', (err) => {
        console.log('Socket error, stopping stream', err);
        clearInterval(interval);
    });
});

app.ws('/stream', async (ws, req) => {
    const jmuxer = new JMuxer({
        mode: 'video',
        fps: 30,
        debug: false,
        onData: (data) => {
            ws.send(data);
        }
    });

    let current = 0;

    const feedChunk = () => {
        const chunk = bufferH264.slice(current == 0 ? 0 : chunksH264[current - 1], chunksH264[current]);
        current = (current + 1) % chunksH264.length;
        jmuxer.feed({
            video: chunk,
        });
    }

    const interval = setInterval(function() {
        feedChunk();
    }, 1500);

    ws.on('close', () => {
        console.log('Socket closed, stopping stream');
        clearInterval(interval);
        jmuxer.destroy();
    });

    ws.on('error', (err) => {
        console.log('Socket error, stopping stream', err);
        clearInterval(interval);
        jmuxer.destroy();
    });
});

// this is actually taken from the H264 parser implementation
// if you want you can feed data without prior parsing
// here we are chunking it to simulate a live feed (eg. from a camera)
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

app.listen(PORT, () => {
    console.log(`Demo ready at http://localhost:${PORT}/ `);
})