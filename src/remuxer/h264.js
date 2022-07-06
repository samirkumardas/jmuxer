import * as debug from '../util/debug';
import { H264Parser } from '../parsers/h264.js';
import { BaseRemuxer } from './base.js';

export class H264Remuxer extends BaseRemuxer {

    constructor(timescale) {
        super();
        this.readyToDecode = false;
        this.nextDts = 0;
        this.dts = 0;
        this.mp4track = {
            id: BaseRemuxer.getTrackID(),
            type: 'video',
            len: 0,
            fragmented: true,
            sps: '',
            pps: '',
            fps: 30,
            width: 0,
            height: 0,
            timescale: timescale,
            duration: timescale,
            samples: [],
        };
        this.samples = [];
        this.h264 = new H264Parser(this);
    }

    resetTrack() {
        this.readyToDecode = false;
        this.mp4track.sps = '';
        this.mp4track.pps = '';
        this.nextDts = 0;
        this.dts = 0;
    }

    remux(frames) {
        for (let frame of frames) {
            let units = [];
            let size = 0;
            for (let unit of frame.units) {
                if (this.h264.parseNAL(unit)) {
                    units.push(unit);
                    size += unit.getSize();
                }
            }
            if (units.length > 0 && this.readyToDecode) {
                this.mp4track.len += size;
                this.samples.push({
                    units: units,
                    size: size,
                    keyFrame: frame.keyFrame,
                    duration: frame.duration,
                    compositionTimeOffset: frame.compositionTimeOffset
                });
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
                cts: sample.compositionTimeOffset || 0,
                flags: {
                    isLeading: 0,
                    isDependedOn: 0,
                    hasRedundancy: 0,
                    degradPrio: 0,
                    isNonSync: sample.keyFrame ? 0 : 1,
                    dependsOn: sample.keyFrame ? 2 : 1,
                },
            };

            for (const unit of units) {
                payload.set(unit.getData(), offset);
                offset += unit.getSize();
            }
            samples.push(mp4Sample);
        }

        if (!samples.length) return null;

        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
    }
}
