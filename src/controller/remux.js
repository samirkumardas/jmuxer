import * as debug from '../util/debug';
import { MP4 } from '../util/mp4-generator.js';
import { AACRemuxer } from '../remuxer/aac.js';
import { H264Remuxer } from '../remuxer/h264.js';
import { H265Remuxer } from '../remuxer/h265.js';
import { appendByteArray, secToTime } from '../util/utils.js';
import Event from '../util/event';

export default class RemuxController extends Event {

    constructor(env, live, videoCodec, frameDuration) {
        super('remuxer');
        this.videoCodec = videoCodec;
        this.frameDuration = frameDuration;
        this.initialized = false;
        this.tracks = {};
        this.seq = 1;
        this.env = env;
        this.timescale = 1000;
        this.mediaDuration = live ? 0xffffffff : 0;
    }

    addTrack(type) {
        if (type === 'video' || type === 'both') {
            if (this.videoCodec == 'H265') {
                this.tracks.video = new H265Remuxer(this.timescale, this.mediaDuration, this.frameDuration);
            } else {
                this.tracks.video = new H264Remuxer(this.timescale, this.mediaDuration, this.frameDuration);
            }
            this.tracks.video.on('outOfData', () => {
                this.dispatch('missingVideoFrames');
            });
            this.tracks.video.on('keyframePosition', (time) => {
                this.dispatch('keyframePosition', time);
            });
        }
        if (type === 'audio' || type === 'both') {
            const aacRemuxer = new AACRemuxer(this.timescale, this.mediaDuration, this.frameDuration);
            this.tracks.audio = aacRemuxer;
            this.tracks.audio.on('outOfData', () => {
                this.dispatch('missingAudioFrames');
            });
        }
    }

    reset() {
        for (const type in this.tracks) {
            this.tracks[type].resetTrack();
        }
        this.initialized = false;
    }

    destroy() {
        this.tracks = {};
        this.offAll();
    }

    flush() {
        if (!this.initialized) {
            if (!this.isReady()) return;

            this.dispatch('ready');
            this.initSegment();
            this.initialized = true;
        }

        for (const type in this.tracks) {
            let track = this.tracks[type];
            let pay = track.getPayload();
            if (pay && pay.byteLength) {
                const moof = MP4.moof(this.seq, track.dts, track.mp4track);
                const mdat = MP4.mdat(pay);
                let payload = appendByteArray(moof, mdat);
                let data = {
                    type: type,
                    payload: payload,
                    dts: track.dts
                };
                if (type === 'video') {
                    data.fps = track.mp4track.fps;
                }
                this.dispatch('buffer', data);
                let duration = secToTime(track.dts / this.timescale);
                debug.log(`put segment (${type}): dts: ${track.dts} frames: ${track.mp4track.samples.length} second: ${duration}`);
                track.flush();
                this.seq++;
            }
        }
    }

    initSegment() {
        let tracks = [];
        for (const type in this.tracks) {
            let track = this.tracks[type];
            if (this.env == 'browser') {
                let data = {
                    type: type,
                    payload: MP4.initSegment([track.mp4track], this.mediaDuration, this.timescale),
                };
                this.dispatch('buffer', data);
            } else {
                tracks.push(track.mp4track);
            }
        }
        if (this.env == 'node') {
            let data = {
                type: 'all',
                payload: MP4.initSegment(tracks, this.mediaDuration, this.timescale),
            };
            this.dispatch('buffer', data);
        }
        debug.log('Initial segment generated.');
    }

    isReady() {
        for (const type in this.tracks) {
            if (!this.tracks[type].readyToDecode || !this.tracks[type].samples.length) return false;
        }
        return true;
    }

    feed(data) {
        let remux = false;
        
        if (data.video && this.tracks.video) {
            remux |= this.tracks.video.feed(data.video, data.duration, data.compositionTimeOffset, data.isLastVideoFrameComplete);
        }
        if (data.audio && this.tracks.audio) {
            remux |= this.tracks.audio.feed(data.audio, data.duration);
        }

        if (!remux) {
            debug.error('Input object must have video and/or audio property. Make sure it is a valid typed array');
            return;
        }

        this.flush();
    }
}
