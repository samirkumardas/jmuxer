import * as debug from '../util/debug';
import { H264Parser, NALU264 } from '../parsers/h264.js';
import { BaseRemuxer } from './base.js';
import { appendByteArray } from '../util/utils.js';

export class H264Remuxer extends BaseRemuxer {

    constructor(timescale, duration, frameDuration) {
        super('H264Remuxer');
        this.frameDuration = frameDuration;
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
            duration: duration,
            samples: [],
        };
        this.samples = [];
        this.remainingData = new Uint8Array();
        this.kfCounter = 0;
        this.pendingUnits = {};
    }

    resetTrack() {
        this.readyToDecode = false;
        this.mp4track.sps = '';
        this.mp4track.pps = '';
        this.nextDts = 0;
        this.dts = 0;
        this.remainingData = new Uint8Array();
        this.kfCounter = 0;
        this.pendingUnits = {};
    }

    feed(data, duration, compositionTimeOffset) {
        let slices = [];
        let left;
        data = appendByteArray(this.remainingData, data);
        [slices, left] = H264Parser.extractNALu(data);
        this.remainingData = left || new Uint8Array();
    
        if (slices.length > 0) {
            this.remux(this.getVideoFrames(slices, duration, compositionTimeOffset));
            return true;
        } else {
            debug.error('Failed to extract any NAL units from video data:', left);
            this.dispatch('outOfData');
            return false;
        }
    }

    getVideoFrames(nalus, duration, compositionTimeOffset) {
        let units = [],
            frames = [],
            fd = 0, // frame duration
            tt = 0, // time ticks (remainder adjustment counter)
            keyFrame = false,
            vcl = false; // Video Coding Layer data (i.e., a "real" frame)
        if (this.pendingUnits.units) {
            units = this.pendingUnits.units;
            vcl = this.pendingUnits.vcl;
            keyFrame = this.pendingUnits.keyFrame;
            this.pendingUnits = {};
        }

        for (let nalu of nalus) {
            let unit = new NALU264(nalu);

            // frame boundary detection
            if (units.length && vcl && (unit.isFirstSlice || !unit.isVCL)) {
                frames.push({
                    units,
                    keyFrame
                });
                units = [];
                keyFrame = false;
                vcl = false;
            }

            units.push(unit);
            keyFrame = keyFrame || unit.isKeyframe;
            vcl = vcl || unit.isVCL;
        }

        if (units.length) {
            // lets keep indecisive nalus as pending in case of fixed fps
            if (!duration) {
                this.pendingUnits = {
                    units,
                    keyFrame,
                    vcl
                };
            } else if (vcl) {
                frames.push({
                    units,
                    keyFrame
                });
            } else {
                let last = frames.length - 1;
                if (last >= 0) {
                    frames[last].units = frames[last].units.concat(units);
                }
            }
        }

        fd = duration ? duration / frames.length | 0 : this.frameDuration;
        tt = duration ? (duration - (fd * frames.length)) : 0;

        frames.map((frame) => {
            frame.duration = fd;
            frame.compositionTimeOffset = compositionTimeOffset;
            if (tt > 0) {
                frame.duration++;
                tt--;
            }
            this.kfCounter++;
            if (frame.keyFrame) {
                this.dispatch('keyframePosition', (this.kfCounter * fd) / 1000);
            }
        });
        debug.log(`jmuxer: No. of H264 frames of the last chunk: ${frames.length}`);
        return frames;
    }

    remux(frames) {
        for (let frame of frames) {
            let units = [];
            let size = 0;
            for (let unit of frame.units) {
                if (this.parseNAL(unit)) {
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

    parseSPS(sps) {
        var config = H264Parser.readSPS(new Uint8Array(sps));

        this.mp4track.fps = config.fps || this.mp4track.fps;
        this.mp4track.width = config.width;
        this.mp4track.height = config.height;
        this.mp4track.sps = [new Uint8Array(sps)];
        this.mp4track.codec = 'avc1.';

        let codecarray = new DataView(sps.buffer, sps.byteOffset + 1, 4);
        for (let i = 0; i < 3; ++i) {
            var h = codecarray.getUint8(i).toString(16);
            if (h.length < 2) {
                h = '0' + h;
            }
            this.mp4track.codec += h;
        }
    }

    parsePPS(pps) {
        this.mp4track.pps = [new Uint8Array(pps)];
    }

    parseNAL(unit) {
        if (!unit) return false;

        if (unit.isVCL) {
            return true;
        }

        let push = false;
        switch (unit.type()) {
            case NALU264.PPS:
                if (!this.mp4track.pps) {
                    this.parsePPS(unit.getPayload());
                }
                push = true;
                break;
            case NALU264.SPS:
                if (!this.mp4track.sps) {
                    this.parseSPS(unit.getPayload());
                }
                push = true;
                break;
            case NALU264.AUD:
                debug.log('AUD - ignoing');
                break;
            case NALU264.SEI:
                debug.log('SEI - ignoing');
                break;
            default:
        }

        if (!this.readyToDecode && this.mp4track.pps && this.mp4track.sps) {
            this.readyToDecode = true;
        }
        
        return push;
    }
}
