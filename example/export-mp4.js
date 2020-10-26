const fs = require('fs');
const { Readable } = require('stream');
const JMuxer = require('./jmuxer.min');

const rawChunks = './raw/';
const PORT = process.env.PORT || 8080;
let chunks = [],
    interval = 0,
    total = 0,
    current = 0;

const jmuxer = new JMuxer({
    exportPath: './jmuxer.mp4',
    debug: true
});

fs.readdir(rawChunks, (err, files) => {
    /* bit crazy here :) */
    files = files.filter(file => file.indexOf('.txt') !== -1);
    files = files.map(file => parseInt(file));
    files.sort((a, b) => a - b);
    files.forEach((file) => {
        fs.readFile(rawChunks + file + '.txt', (err, data) => {
            if (err) throw err;
            chunks.push(data);
            total++;
            if (files.length == total) {
                simulateChunk();
            }
        });
    });
});
function parse(data) {
      var input = new Uint8Array(data),
          dv = new DataView(input.buffer),
          duration,
          audioLength,
          audio,
          video;

      duration = dv.getUint16(0, true);
      audioLength = dv.getUint16(2, true);
      audio = input.subarray(4, (audioLength + 4));
      video = input.subarray(audioLength + 4);

      return {
        audio: audio,
        video: video,
        duration: duration
      };
 }
 function simulateChunk() {
    let chunk,
        anyOneThere = false;
    chunk = chunks[current];
    current++;
    jmuxer.feed(parse(chunk));
    if (current < total) {
        setTimeout(simulateChunk, 0);
    } else {
        jmuxer.destroy();
        process.exit();
    }
}