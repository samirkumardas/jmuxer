import * as debug from './util/debug';
import { NALU } from './util/nalu.js';
import { appendByteArray } from './util/utils.js';
import { H264Parser } from './parsers/h264.js';
import { AACParser } from './parsers/aac.js';
import Event from './util/event';
import RemuxController from './controller/remux.js';
import BufferController from './controller/buffer.js';
import { Duplex } from 'stream';

export default class JMuxer extends Event {
    static isSupported(codec) {
        return (window.MediaSource && window.MediaSource.isTypeSupported(codec));
    }

    constructor(options) {
        super('jmuxer');
        let defaults = {
            node: '',
            mode: 'both', // both, audio, video
            flushingTime: 1500,
            clearBuffer: true,
            fps: 30,
            debug: false,
            onReady: function() {}, // function called when MSE is ready to accept frames
            onError: function() {}, // function called when jmuxer encounters any buffer related error
        };
        this.options = Object.assign({}, defaults, options);
        this.env = typeof process === 'object' && typeof window === 'undefined' ? 'node' : 'browser';
        if (this.options.debug) {
            debug.setLogger();
        }

        if (!this.options.fps) {
            this.options.fps = 30;
        }
        this.frameDuration = (1000 / this.options.fps) | 0;
        this.remuxController = new RemuxController(this.env);
        this.remuxController.addTrack(this.options.mode);
        this.lastCleaningTime = Date.now();
        this.kfPosition = [];
        this.kfCounter  = 0;
        this.pendingUnits = {};
        this.remainingData = new Uint8Array();

        /* events callback */
        this.remuxController.on('buffer', this.onBuffer.bind(this));
        if (this.env == 'browser') {
            this.remuxController.on('ready', this.createBuffer.bind(this));
            this.initBrowser();
        }
        if(this.options.flushingTime !== 0){
            this.startInterval();
        }

    }

    initBrowser() {
        if (typeof this.options.node === 'string' && this.options.node == '') {
            debug.error('no video element were found to render, provide a valid video element');
        }
        this.node = typeof this.options.node === 'string' ? document.getElementById(this.options.node) : this.options.node;
        this.mseReady = false;
        this.setupMSE();
    }

    createStream() {
        let feed = this.feed.bind(this);
        let destroy = this.destroy.bind(this);
        this.stream = new Duplex({
            writableObjectMode: true,
            read(size) {
            },
            write(data, encoding, callback) {
                feed(data);
                callback();
            },
            final(callback) {
                destroy();
                callback();
            }
        });
        return this.stream;
    }

    setupMSE() {
        window.MediaSource = window.MediaSource || window.WebKitMediaSource;
        if (!window.MediaSource) {
            throw 'Oops! Browser does not support media source extension.';
        }
        this.isMSESupported = !!window.MediaSource;
        this.mediaSource = new MediaSource();
        this.url = URL.createObjectURL(this.mediaSource);
        this.node.src = this.url;
        this.mseEnded = false;
        this.mediaSource.addEventListener('sourceopen', this.onMSEOpen.bind(this));
        this.mediaSource.addEventListener('sourceclose', this.onMSEClose.bind(this));
        this.mediaSource.addEventListener('webkitsourceopen', this.onMSEOpen.bind(this));
        this.mediaSource.addEventListener('webkitsourceclose', this.onMSEClose.bind(this));
    }

    endMSE() {
        if (!this.mseEnded) {
            try {
                this.mseEnded = true;
                this.mediaSource.endOfStream();
            } catch (e) {
                debug.error('mediasource is not available to end');
            }
        }
    }

    feed(data) {
        let remux = false,
            slices,
            left,
            duration,
            chunks = {
                video: [],
                audio: []
            };

        if (!data || !this.remuxController) return;
        duration = data.duration ? parseInt(data.duration) : 0;
        if (data.video) {
            data.video = appendByteArray(this.remainingData, data.video);
            [slices, left] = H264Parser.extractNALu(data.video);
            if (slices.length > 0) {
                chunks.video = this.getVideoFrames(slices, duration);
                remux = true;
            }
            this.remainingData = left || new Uint8Array();
        }
        if (data.audio) {
            slices = AACParser.extractAAC(data.audio);
            if (slices.length > 0) {
                chunks.audio = this.getAudioFrames(slices, duration);
                remux = true;
            }
        }
        if (!remux) {
            debug.error('Input object must have video and/or audio property. Make sure it is a valid typed array');
            return;
        }
        this.remuxController.remux(chunks);
    }

    getVideoFrames(nalus, duration) {
        let units = [],
            frames = [],
            fd = 0,
            tt = 0,
            keyFrame = false,
            vcl = false;
        if (this.pendingUnits.units) {
            units      = this.pendingUnits.units;
            vcl        = this.pendingUnits.vcl;
            keyFrame   = this.pendingUnits.keyFrame;
            this.pendingUnits = {};
        }
        for (let nalu of nalus) {
            let unit = new NALU(nalu);
            if (unit.type() === NALU.IDR || unit.type() === NALU.NDR) {
                H264Parser.parseHeader(unit);
            }
            if (units.length && vcl && (unit.isfmb || !unit.isvcl)) {
                frames.push({
                    units,
                    keyFrame
                });
                units = [];
                keyFrame = false;
                vcl = false;
            }
            units.push(unit);
            keyFrame = keyFrame || unit.isKeyframe();
            vcl = vcl || unit.isvcl;
        }
        if (units.length) {
            // lets keep indecisive nalus as pending in case of fixed fps
            if (!duration) {
                this.pendingUnits = {
                    units,
                    keyFrame,
                    vcl
                };
            }
            else if (vcl) {
                frames.push({
                    units,
                    keyFrame
                });
            } else {
                let last = frames.length - 1;
                frames[last].units = frames[last].units.concat(units);
            }
        }
        fd = duration ? duration / frames.length | 0 : this.frameDuration;
        tt = duration ? (duration - (fd * frames.length)) : 0;

        frames.map((frame) => {
            frame.duration = fd;
            if (tt > 0) {
                frame.duration++;
                tt--;
            }
            this.kfCounter++;
            if (frame.keyFrame && this.options.clearBuffer) {
                this.kfPosition.push((this.kfCounter * fd) / 1000);
            }
        });
        debug.log(`jmuxer: No. of frames of the last chunk: ${frames.length}`);
        return frames;
    }

    getAudioFrames(aacFrames, duration) {
        let frames = [],
            fd = 0,
            tt = 0;

        for (let units of aacFrames) {
            frames.push({units});
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

    destroy() {
        this.stopInterval();
        if (this.stream) {
            this.remuxController.flush();
            this.stream.push(null);
            this.stream = null;
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
            this.endMSE();
        }
        this.node = false;
        this.mseReady = false;
        this.videoStarted = false;
        this.mediaSource = null;
    }

    reset() {
        this.node.pause();
        if (this.remuxController) {
            this.remuxController.reset();
        }
        if (this.bufferControllers) {
            for (let type in this.bufferControllers) {
                this.bufferControllers[type].destroy();
            }
            this.bufferControllers = null;
            this.endMSE();
        }
        if (this.env == 'browser') {
            this.initBrowser();
        }
        debug.log('JMuxer was reset');
    }

    createBuffer() {
        if (!this.mseReady || !this.remuxController || !this.remuxController.isReady() || this.bufferControllers) return;
        this.bufferControllers = {};
        for (let type in this.remuxController.tracks) {
            let track = this.remuxController.tracks[type];
            if (!JMuxer.isSupported(`${type}/mp4; codecs="${track.mp4track.codec}"`)) {
                debug.error('Browser does not support codec');
                return false;
            }
            let sb = this.mediaSource.addSourceBuffer(`${type}/mp4; codecs="${track.mp4track.codec}"`);
            this.bufferControllers[type] = new BufferController(sb, type);
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

    getSafeClearOffsetOfBuffer(offset) {
        let maxLimit = (this.options.mode === 'audio' && offset) || 0,
            adjacentOffset;
        for (let i = 0; i < this.kfPosition.length; i++) {
            if (this.kfPosition[i] >= offset) {
                break;
            }
            adjacentOffset = this.kfPosition[i];
        }
        if (adjacentOffset) {
            this.kfPosition = this.kfPosition.filter( kfDelimiter => {
                if (kfDelimiter < adjacentOffset) {
                    maxLimit = kfDelimiter;
                }
                return kfDelimiter >= adjacentOffset;
            });
        }
        return maxLimit;
    }

    clearBuffer() {
        if (this.options.clearBuffer && (Date.now() - this.lastCleaningTime) > 10000) {
            for (let type in this.bufferControllers) {
                let cleanMaxLimit = this.getSafeClearOffsetOfBuffer(this.node.currentTime);
                this.bufferControllers[type].initCleanup(cleanMaxLimit);
            }
            this.lastCleaningTime = Date.now();
        }
    }

    onBuffer(data) {
        if (this.env == 'browser') {
            if (this.bufferControllers && this.bufferControllers[data.type]) {
                this.bufferControllers[data.type].feed(data.payload);
            }
        } else if(this.stream) {
            this.stream.push(data.payload);
        }
        if(this.options.flushingTime === 0){
            if (this.bufferControllers) {
                this.releaseBuffer();
                this.clearBuffer();
            }
        }
    }

    /* Events on MSE */
    onMSEOpen() {
        this.mseReady = true;
        if (typeof this.options.onReady === 'function') {
            this.options.onReady.call(null);
        }
        URL.revokeObjectURL(this.url);
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
        else {
            this.endMSE();
        }
        if (typeof this.options.onError === 'function') {
            this.options.onError.call(null, data);
        }
    }
}
