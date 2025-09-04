import * as debug from '../util/debug';

export class AACParser {

    static get samplingRateMap() {
        return [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
    }

    static getHeaderLength(data) {
        return (data[1] & 0x01 ? 7 : 9);  // without CRC 7 and with CRC 9 Refs: https://wiki.multimedia.cx/index.php?title=ADTS
    }

    static getFrameLength(data) {
        return ((data[3] & 0x03) << 11) | (data[4] << 3) | ((data[5] & 0xE0) >>> 5); // 13 bits length ref: https://wiki.multimedia.cx/index.php?title=ADTS
    }

    static isAACPattern (data) {
        return data[0] === 0xff && (data[1] & 0xf0) === 0xf0 && (data[1] & 0x06) === 0x00;
    }

    static extractAAC(buffer) {
        let i = 0,
            length = buffer.byteLength,
            slices = [],
            headerLength,
            frameLength;

        if (!AACParser.isAACPattern(buffer)) {
            debug.error('Invalid ADTS audio format');
            return {
                valid: false,
            };
        }
        headerLength = AACParser.getHeaderLength(buffer);
        const header = buffer.subarray(0, headerLength);

        while (i < length) {
            frameLength = AACParser.getFrameLength(buffer);
            slices.push(buffer.subarray(headerLength, frameLength));
            buffer = buffer.slice(frameLength);
            i += frameLength;
        }
        return {
            valid: true,
            header,
            slices,
        };
    }

}