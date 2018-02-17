import * as debug from '../util/debug';
import { AACParser } from '../parsers/aac.js';
import { BaseRemuxer } from './base.js';

export class AACRemuxer extends BaseRemuxer {

    constructor() {
        super();
        this.readyToDecode = false;
        this.nextDts = 0;
        this.dts = 0;
        this.timescale = 1000;

        this.mp4track = {
            id: BaseRemuxer.getTrackID(),
            type: 'audio',
            channelCount: 0,
            len: 0,
            fragmented: true,
            timescale: this.timescale,
            duration: this.timescale,
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
    }

    remux(samples) {
        let config,
            sample,
            size,
            payload;
        for (let sample of samples) {
            payload = sample.units;
            size = payload.byteLength;
            this.samples.push({
                units: payload,
                size: size,
                duration: sample.duration,
            });
            this.mp4track.len += size;
            if (!this.readyToDecode) {
                this.aac.setAACConfig();
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
}
