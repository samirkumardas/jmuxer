import fs from "fs";
import JMuxer from "./jmuxer.min.js";


// this demo is mainly for development purposes
// if you need to analyze a generated mp4 this is a good way
// you can later run mp4dump out.mp4 to inspect the contents
// (mp4dump is from bento4)

(async () => {
    const fileStream = fs.createWriteStream('out.mp4');

    const jMuxer = new JMuxer({
        mode: 'video',
        onData: (data) => {
            fileStream.write(data);
        },
        debug: true,
        videoCodec: 'H265',
    });

    jMuxer.feed({
        video: new Uint8Array(await fs.promises.readFile('./demo.h265'))
    });
})();