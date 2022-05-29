import * as debug from '../util/debug';
import { AACParser } from '../parsers/aac.js';
import { BaseRemuxer } from './base.js';

export class AACRemuxer extends BaseRemuxer {

    constructor(timescale) {
        super();
        this.readyToDecode = false;
        this.nextDts = 0;
        this.dts = 0;
        this.mp4track = {
            id: BaseRemuxer.getTrackID(),
            type: 'audio',
            channelCount: 0,
            len: 0,
            fragmented: true,
            timescale: timescale,
            duration: timescale,
            samples: [],
            config: '',
            codec: '',
        };
        this.samples = [];
        this.aac = new AACParser(this);
    }

    resetTrack() {
        this.readyToDecode = false;
        this.mp4track.codec = '';
        this.mp4track.channelCount = '';
        this.mp4track.config = '';
        this.mp4track.timescale = this.timescale;
        this.nextDts = 0;
        this.dts = 0;
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
                    this.aac.setAACConfig();
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

    getAacParser() {
        return this.aac;
    }
}
