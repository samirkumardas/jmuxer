import * as debug from '../util/debug';
import { AACParser } from '../parsers/aac.js';
import { BaseRemuxer } from './base.js';

export class AACRemuxer extends BaseRemuxer {

    constructor(timescale, duration, frameDuration) {
        super('AACRemuxer');
        this.frameDuration = frameDuration;
        this.readyToDecode = false;
        this.header = null;
        this.nextDts = 0;
        this.dts = 0;
        this.mp4track = {
            id: BaseRemuxer.getTrackID(),
            type: 'audio',
            channelCount: 0,
            len: 0,
            fragmented: true,
            timescale: timescale,
            duration: duration,
            samples: [],
            config: '',
            codec: '',
        };
        this.samples = [];
    }

    resetTrack() {
        this.readyToDecode = false;
        this.header = null;
        this.mp4track.codec = '';
        this.mp4track.channelCount = '';
        this.mp4track.config = '';
        this.mp4track.timescale = this.timescale;
        this.nextDts = 0;
        this.dts = 0;
    }

    feed(data, duration) {
        const { valid, header, slices } = AACParser.extractAAC(data);
        if (!this.header) this.header = header;
        if (valid && slices.length > 0) {
            this.remux(this.getAudioFrames(slices, duration));
            return true;
        } else {
            debug.error('Failed to extract audio data from:', data);
            this.dispatch('outOfData');
            return false;
        }
    }

    getAudioFrames(aacFrames, duration) {
        let frames = [],
            fd = 0,
            tt = 0;

        for (let units of aacFrames) {
            frames.push({ units });
        }
        fd = duration ? duration / frames.length | 0 : this.frameDuration;
        tt = duration ? (duration - (fd * frames.length)) : 0;
        frames.map((frame) => {
            frame.duration = fd;
            if (tt > 0) {
                frame.duration++;
                tt--;
            }
        });
        return frames;
    }

    remux(frames) {
        if (frames.length > 0) {
            for (let i = 0; i < frames.length; i++) {
                let frame = frames[i];
                let payload = frame.units;
                let size = payload.byteLength;
                this.samples.push({
                    units: payload,
                    size: size,
                    duration: frame.duration,
                });
                this.mp4track.len += size;
                if (!this.readyToDecode) {
                    this.setAACConfig();
                }
            }
        }
    }

    getPayload() {
        if (!this.isReady()) {
            return null;
        }

        let payload = new Uint8Array(this.mp4track.len);
        let offset = 0;
        let samples = this.mp4track.samples;
        let mp4Sample,
            duration;

        this.dts = this.nextDts;

        while (this.samples.length) {
            let sample = this.samples.shift(),
                units = sample.units;

            duration = sample.duration;

            if (duration <= 0) {
                debug.log(`remuxer: invalid sample duration at DTS: ${this.nextDts} :${duration}`);
                this.mp4track.len -= sample.size;
                continue;
            }

            this.nextDts += duration;
            mp4Sample = {
                size: sample.size,
                duration: duration,
                cts: 0,
                flags: {
                    isLeading: 0,
                    isDependedOn: 0,
                    hasRedundancy: 0,
                    degradPrio: 0,
                    dependsOn: 1,
                },
            };

            payload.set(sample.units, offset);
            offset += sample.size;
            samples.push(mp4Sample);
        }

        if (!samples.length) return null;

        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
    }

    setAACConfig() {
        let objectType,
            sampleIndex,
            channelCount,
            config = new Uint8Array(2);

        if (!this.header) return;
            
        objectType = ((this.header[2] & 0xC0) >>> 6) + 1;
        sampleIndex = ((this.header[2] & 0x3C) >>> 2);
        channelCount = ((this.header[2] & 0x01) << 2);
        channelCount |= ((this.header[3] & 0xC0) >>> 6);

        /* refer to http://wiki.multimedia.cx/index.php?title=MPEG-4_Audio#Audio_Specific_Config */
        config[0] = objectType << 3;
        config[0] |= (sampleIndex & 0x0E) >> 1;
        config[1] |= (sampleIndex & 0x01) << 7;
        config[1] |= channelCount << 3;

        this.mp4track.codec = 'mp4a.40.' + objectType;
        this.mp4track.channelCount = channelCount;
        this.mp4track.config = config;
        this.readyToDecode = true;
    }
}
