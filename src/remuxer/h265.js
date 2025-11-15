import * as debug from '../util/debug';
import { H265Parser, NALU265 } from '../parsers/h265.js';
import { BaseRemuxer } from './base.js';
import { appendByteArray, reverseBits, removeTrailingDotZero } from '../util/utils.js';

export class H265Remuxer extends BaseRemuxer {

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
            vps: '',
            sps: '',
            pps: '',
            hvcC: {},
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
        this.mp4track.vps = '';
        this.mp4track.sps = '';
        this.mp4track.pps = '';
        this.mp4track.hvcC = {};
        this.nextDts = 0;
        this.dts = 0;
        this.remainingData = new Uint8Array();
        this.kfCounter = 0;
        this.pendingUnits = {};
    }

    feed(data, duration, compositionTimeOffset, isLastFrameComplete = false) {
        let slices = [];
        let left;
        data = appendByteArray(this.remainingData, data);
        [slices, left] = H265Parser.extractNALu(data);
        if (left) {
            if (isLastFrameComplete) {
                slices.push(left);
            } else {
                this.remainingData = left;
            }
        } else {
            this.remainingData = new Uint8Array();
        }
    
        if (slices.length > 0) {
            this.remux(this.getVideoFrames(slices, duration, compositionTimeOffset));
            return true;
        } else {
            debug.log('Failed to extract any NAL units from video data:', left);
            this.dispatch('outOfData');
            return false;
        }
    }

    getVideoFrames(nalus, duration, compositionTimeOffset) {
        let units = [],
            frames = [],
            fd = 0,
            tt = 0,
            keyFrame = false,
            vcl = false;

        if (this.pendingUnits.units) {
            units = this.pendingUnits.units;
            vcl = this.pendingUnits.vcl;
            keyFrame = this.pendingUnits.keyFrame;
            this.pendingUnits = {};
        }

        for (let nalu of nalus) {
            let unit = new NALU265(nalu);
            
            if (!this.parseNAL(unit)) continue;

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

        fd = duration ? (duration / frames.length) | 0 : this.frameDuration;
        tt = duration ? duration - fd * frames.length : 0;

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

        debug.log(`jmuxer: No. of H265 frames of the last chunk: ${frames.length}`);
        return frames;
    }

    remux(frames) {
        for (let frame of frames) {
            let size = frame.units.reduce((acc, cur) => acc + cur.getSize(), 0);
            if (frame.units.length > 0 && this.readyToDecode) {
                this.mp4track.len += size;
                this.samples.push({
                    units: frame.units,
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
        this.mp4track.sps = [new Uint8Array(sps)];
        
        sps = H265Parser.removeEmulationPreventionBytes(sps);
        const config = H265Parser.readSPS(new Uint8Array(sps));

        this.mp4track.fps = config.fps || this.mp4track.fps;
        this.mp4track.width = config.width;
        this.mp4track.height = config.height;

        this.mp4track.codec = 'hvc1'
            + '.' + (config.profile_space ? String.fromCharCode(64 + config.profile_space) : '') // Map [0,1,2,3] to ['','A','B','C']
            + config.profile_idc
            + '.' + reverseBits(config.profile_compatibility_flags).toString(16)
            + '.' + (config.tier_flag ? 'H' : 'L') + config.level_idc
            + '.' + removeTrailingDotZero(config.constraint_indicator_flags.map(function (b) { return b.toString(16); }).join('.').toUpperCase());

        this.mp4track.hvcC = {
            profile_space: config.profile_space,
            tier_flag: config.tier_flag,
            profile_idc: config.profile_idc,
            profile_compatibility_flags: config.profile_compatibility_flags,
            constraint_indicator_flags: config.constraint_indicator_flags,
            level_idc: config.level_idc,
            chroma_format_idc: config.chroma_format_idc
        };
    }

    parsePPS(pps) {
        this.mp4track.pps = [pps];
    }

    parseVPS(vps) {
        this.mp4track.vps = [vps];
    }

    parseNAL(unit) {
        if (!unit) return false;

        if (unit.isVCL) {
            return true;
        }

        let push = false;
        switch (unit.type()) {
            case NALU265.VPS:
                if (!this.mp4track.vps) {
                    this.parseVPS(unit.getPayload());
                }
                push = true;
                break;

            case NALU265.SPS:
                if (!this.mp4track.sps) {
                    this.parseSPS(unit.getPayload());
                }
                push = true;
                break;

            case NALU265.PPS:
                if (!this.mp4track.pps) {
                    this.parsePPS(unit.getPayload());
                }
                push = true;
                break;
            case NALU265.AUD:
                debug.log('AUD - ignoing');
                break;
            case NALU265.SEI:
            case NALU265.SEI2:
                debug.log('SEI - ignoing');
                break;
            default:
        }

        if (!this.readyToDecode && this.mp4track.vps && this.mp4track.sps && this.mp4track.pps) {
            this.readyToDecode = true;
        }

        return push;
    }
}
