import * as debug from './util/debug';
import { NALU } from './util/nalu.js';
import { H264Parser } from './parsers/h264.js';
import { AACParser } from './parsers/aac.js';
import Event from './util/event';
import RemuxController from './controller/remux.js';
import BufferController from './controller/buffer.js';

window.MediaSource = window.MediaSource || window.WebKitMediaSource;

export default class JMuxmer extends Event {

    static isSupported(codec) {
        return (window.MediaSource && window.MediaSource.isTypeSupported(codec));
    }

    constructor(options) {
        super('jmuxer');
        window.MediaSource = window.MediaSource || window.WebKitMediaSource;

        let defaults = {
            node: '',
            mode: 'both', // both, audio, video
            flushingTime: 1500,
            clearBuffer: true,
            fps: 30,
            debug: false
        };
        this.options = Object.assign({}, defaults, options);

        if (this.options.debug) {
            debug.setLogger();
        }

        if (typeof this.options.node === 'string' && this.options.node == '') {
            debug.error('no video element were found to render, provide a valid video element');
        }

        if (!this.options.fps) {
            this.options.fps = 30;
        }
        this.frameDuration = (1000 / this.options.fps) | 0;

        this.node = typeof this.options.node === 'string' ? document.getElementById(this.options.node) : this.options.node;
    
        this.sourceBuffers = {};
        this.isMSESupported = !!window.MediaSource;
       
        if (!this.isMSESupported) {
            throw 'Oops! Browser does not support media source extension.';
        }

        this.setupMSE();
        this.remuxController = new RemuxController(this.options.clearBuffer); 
        this.remuxController.addTrack(this.options.mode);
        

        this.mseReady = false;
        this.lastCleaningTime = Date.now();
        this.keyframeCache = [];
        this.frameCounter  = 0;

        /* events callback */
        this.remuxController.on('buffer', this.onBuffer.bind(this));
        this.remuxController.on('ready', this.createBuffer.bind(this));
        this.startInterval();
    }

    setupMSE() {
        this.mediaSource = new MediaSource();
        this.node.src = URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', this.onMSEOpen.bind(this));
        this.mediaSource.addEventListener('sourceclose', this.onMSEClose.bind(this));
        this.mediaSource.addEventListener('webkitsourceopen', this.onMSEOpen.bind(this));
        this.mediaSource.addEventListener('webkitsourceclose', this.onMSEClose.bind(this));
    }

    feed(data) {
        let remux = false,
            nalus,
            aacFrames,
            duration,
            chunks = {
                video: [],
                audio: []
            };

        if (!data) return;
        duration = data.duration ? parseInt(data.duration) : 0;
        if (data.video) {  
            nalus = H264Parser.extractNALu(data.video);
            if (nalus.length > 0) {
                chunks.video = this.getVideoFrames(nalus, duration);
                remux = true;
            }
        }
        if (data.audio) {
            aacFrames = AACParser.extractAAC(data.audio);
            if (aacFrames.length > 0) {
                chunks.audio = this.getAudioFrames(aacFrames, duration);
                remux = true;
            }
        }
        if (!remux) {
            debug.error('Input object must have video and/or audio property. Make sure it is not empty and valid typed array');
            return;
        }
        this.remuxController.remux(chunks);
    }

    getVideoFrames(nalus, duration) {
        let nalu,
            units = [],
            samples = [],
            naluObj,
            sampleDuration,
            adjustDuration = 0,
            numberOfFrames = [];

        for (nalu of nalus) {
            naluObj = new NALU(nalu);
            units.push(naluObj);
            if (naluObj.type() === NALU.IDR || naluObj.type() === NALU.NDR) {
                samples.push({units});
                units = [];
                if (this.options.clearBuffer) {
                    if (naluObj.type() === NALU.IDR) {
                        numberOfFrames.push(this.frameCounter);
                    }
                    this.frameCounter++;
                }
            }
        }
        
        if (duration) {
            sampleDuration = duration / samples.length | 0;
            adjustDuration = (duration - (sampleDuration * samples.length));
        } else {
            sampleDuration = this.frameDuration;
        }
        samples.map((sample) => {
            sample.duration = adjustDuration > 0 ? (sampleDuration + 1) : sampleDuration;
            if (adjustDuration !== 0) {
                adjustDuration--;
            }
        });

        /* cache keyframe times if clearBuffer set true */
        if (this.options.clearBuffer) {
            numberOfFrames = numberOfFrames.map((total) => {
                return (total * sampleDuration) / 1000;
            });
            this.keyframeCache = this.keyframeCache.concat(numberOfFrames);
        }
        return samples;
    }

    getAudioFrames(aacFrames, duration) {
        let samples = [],
            units,
            sampleDuration,
            adjustDuration = 0;

        for (units of aacFrames) {
            samples.push({units});
        }

        if (duration) {
            sampleDuration = duration / samples.length | 0;
            adjustDuration = (duration - (sampleDuration * samples.length));
        } else {
            sampleDuration = this.frameDuration;
        }
        samples.map((sample) => {
            sample.duration = adjustDuration > 0 ? (sampleDuration + 1) : sampleDuration;
            if (adjustDuration !== 0) {
                adjustDuration--;
            }
        });
        return samples;
    }

    destroy() {
        this.stopInterval();
        if (this.mediaSource) {
            try {
                let sbs = this.mediaSource.sourceBuffers;
                for (let sb of sbs) {
                    this.mediaSource.removeSourceBuffer(sb);
                }
                this.mediaSource.endOfStream();
            } catch (e) {
                debug.error(`mediasource is not available to end ${e.message}`);
            }
        }
        if (this.remuxController) {
            this.remuxController.destroy();
            this.remuxController = null;
        }
        if (this.bufferControllers) {
            for (let type in this.bufferControllers) {
                this.bufferControllers[type].destroy();
            }
            this.bufferControllers = null;
        }
        this.node = false;
        this.mseReady = false;
        this.videoStarted = false;
    }

    createBuffer() {
        if (!this.mseReady || !this.remuxController.isReady() || this.bufferControllers) return;
        this.bufferControllers = {};
        for (let type in this.remuxController.tracks) {
            let track = this.remuxController.tracks[type];
            if (!JMuxmer.isSupported(`${type}/mp4; codecs="${track.mp4track.codec}"`)) {
                debug.error('Browser does not support codec');
                return false;
            }
            let sb = this.mediaSource.addSourceBuffer(`${type}/mp4; codecs="${track.mp4track.codec}"`);
            this.bufferControllers[type] = new BufferController(sb, type);
            this.sourceBuffers[type] = sb;
            this.bufferControllers[type].on('error', this.onBufferError.bind(this));
        }
    }

    startInterval() {

        this.interval = setInterval(()=>{
            if (this.bufferControllers) {
                this.releaseBuffer();
                this.clearBuffer();
            }
        }, this.options.flushingTime);
    }

    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    releaseBuffer() {
        for (let type in this.bufferControllers) {
            this.bufferControllers[type].doAppend();
        }
    }

    getSafeBufferClearLimit(offset) {
        let maxLimit = offset,
            adjacentOffset;

        for (let i = 0; i < this.keyframeCache.length; i++) {
            if (this.keyframeCache[i] >= offset) {
                break;
            }
            adjacentOffset = this.keyframeCache[i];
        }
 
        this.keyframeCache = this.keyframeCache.filter( keyframePoint => {
            if (keyframePoint < adjacentOffset) {
                maxLimit = keyframePoint;
            }
            return keyframePoint >= adjacentOffset;
        });
        return maxLimit;
    }

    clearBuffer() {
        if (this.options.clearBuffer && (Date.now() - this.lastCleaningTime) > 10000) {
            for (let type in this.bufferControllers) {
                let cleanMaxLimit = this.getSafeBufferClearLimit(this.node.currentTime);
                this.bufferControllers[type].initCleanup(cleanMaxLimit);
            }
            this.lastCleaningTime = Date.now();
        }
    }

    onBuffer(data) {
        if (this.bufferControllers && this.bufferControllers[data.type]) {
            this.bufferControllers[data.type].feed(data.payload);
        }
    }

    /* Events on MSE */
    onMSEOpen() {
        this.mseReady = true;
        this.createBuffer();
    }

    onMSEClose() {
        this.mseReady = false;
        this.videoStarted = false;
    }

    onBufferError(data) {
        if (data.name == 'QuotaExceeded') {
            this.bufferControllers[data.type].initCleanup(this.node.currentTime);
            return;
        }

        if (this.mediaSource.sourceBuffers.length > 0 && this.sourceBuffers[data.type]) {
            this.mediaSource.removeSourceBuffer(this.sourceBuffers[data.type]);
        }
        if (this.mediaSource.sourceBuffers.length == 0) {
            try {
                this.mediaSource.endOfStream();
            } catch (e) {
                debug.error('mediasource is not available to end');
            }
        }
    }
}