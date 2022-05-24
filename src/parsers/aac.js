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

    extractAAC(buffer) {
        let i = 0,
            length = buffer.byteLength,
            result = [],
            headerLength,
            frameLength;

        if (!AACParser.isAACPattern(buffer)) {
            debug.error('Invalid ADTS audio format');
            return result;
        }
        headerLength = AACParser.getHeaderLength(buffer);
        if (!this.aacHeader) {
            this.aacHeader = buffer.subarray(0, headerLength);
        }

        while (i < length) {
            frameLength = AACParser.getFrameLength(buffer);
            result.push(buffer.subarray(headerLength, frameLength));
            buffer = buffer.slice(frameLength);
            i += frameLength;
        }
        return result;
    }

    constructor(remuxer) {
        this.remuxer = remuxer;
        this.track = remuxer.mp4track;
    }

    setAACConfig() {
        let objectType,
            sampleIndex,
            channelCount,
            config = new Uint8Array(2),
            headerData = this.aacHeader;

        if (!headerData) return;
            
        objectType = ((headerData[2] & 0xC0) >>> 6) + 1;
        sampleIndex = ((headerData[2] & 0x3C) >>> 2);
        channelCount = ((headerData[2] & 0x01) << 2);
        channelCount |= ((headerData[3] & 0xC0) >>> 6);

        /* refer to http://wiki.multimedia.cx/index.php?title=MPEG-4_Audio#Audio_Specific_Config */
        config[0] = objectType << 3;
        config[0] |= (sampleIndex & 0x0E) >> 1;
        config[1] |= (sampleIndex & 0x01) << 7;
        config[1] |= channelCount << 3;

        this.track.codec = 'mp4a.40.' + objectType;
        this.track.channelCount = channelCount;
        this.track.config = config;
        this.remuxer.readyToDecode = true;
    }
}