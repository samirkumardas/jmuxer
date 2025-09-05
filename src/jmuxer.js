import * as debug from './util/debug';
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
        this.isReset = false;
        let defaults = {
            node: '',
            mode: 'both', // both, audio, video
            videoCodec: 'H264', // H264, H265
            flushingTime: 500,
            maxDelay: 500,
            clearBuffer: true,
            fps: 30,
            readFpsFromTrack: false, // set true to fetch fps value from NALu
            debug: false,
            onReady: function() {}, // function called when MSE is ready to accept frames
            onData: function() {}, // function called when data is ready to be sent
            onError: function() {}, // function called when jmuxer encounters any buffer related errors
            onUnsupportedCodec: function() {}, // function called when a codec is not supported by the browser
            onMissingVideoFrames: function () {}, // function called when jmuxer encounters any missing video frames
            onMissingAudioFrames: function () {}, // function called when jmuxer encounters any missing audio frames
            onKeyframePosition: function () {}, // function called when a keyframe is detected thus the provided time is seekable
            onLoggerLog: console.log,
            onLoggerErr: console.error,
        };
        this.options = Object.assign({}, defaults, options);
        this.env = typeof process === 'object' && typeof window === 'undefined' ? 'node' : 'browser';
        if (this.options.debug) {
            debug.setLogger(this.options.onLoggerLog, this.options.onLoggerErr);
        }

        if (!this.options.fps) {
            this.options.fps = 30;
        }
        this.frameDuration = (1000 / this.options.fps) | 0;
        this.remuxController = new RemuxController(this.env, options.live, this.options.videoCodec, this.frameDuration);
        this.remuxController.addTrack(this.options.mode);

        this.initData();

        /* events callback */
        this.remuxController.on('buffer', this.onBuffer.bind(this));
        if (this.env == 'browser') {
            this.remuxController.on('ready', this.createBuffer.bind(this));
            this.initBrowser();
        }

        this.remuxController.on('missingVideoFrames', () => {
            if (typeof this.options.onMissingVideoFrames === 'function') {
                this.options.onMissingVideoFrames.call(null);
            }
        });
        this.remuxController.on('missingAudioFrames', () => {
            if (typeof this.options.onMissingAudioFrames === 'function') {
                this.options.onMissingAudioFrames.call(null);
            }
        });
        if (this.clearBuffer) {
            // this is used to know when keyframes are,
            // to essentially know which specific times are seekable
            this.remuxController.on('keyframePosition', time => {
                this.kfPosition.push(time);
            });
        }
        if (typeof this.options.onKeyframePosition === 'function') {
            this.remuxController.on('keyframePosition', time => {
                this.options.onKeyframePosition.call(null, time);
            });
        }
    }

    initData() {
        this.lastCleaningTime = Date.now();
        this.kfPosition = [];
        this.pendingUnits = {};
        this.remainingData = new Uint8Array();
        this.startInterval();
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
        window.MediaSource = window.MediaSource || window.WebKitMediaSource || window.ManagedMediaSource;
        if (!window.MediaSource) {
            throw 'Oops! Browser does not support Media Source Extension or Managed Media Source (IOS 17+).';
        }
        this.isMSESupported = !!window.MediaSource;
        this.mediaSource = new window.MediaSource();
        this.url = URL.createObjectURL(this.mediaSource);
        if (window.MediaSource === window.ManagedMediaSource) {
            try {
                this.node.removeAttribute('src');
                // ManagedMediaSource will not open without disableRemotePlayback set to false or source alternatives
                this.node.disableRemotePlayback = true;
                const source = document.createElement('source');
                source.type = 'video/mp4';
                source.src = this.url;
                this.node.appendChild(source);
                this.node.load();
            } catch (error) {
                this.node.src = this.url;
            }
        } else {
            this.node.src = this.url;
        }
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
        if (!data || !this.remuxController) return;
        
        data.duration = data.duration ? parseInt(data.duration) : 0;

        this.remuxController.feed(data);
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
        this.stopInterval();
        this.isReset = true;
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
        this.initData();
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
                debug.error(`Browser does not support codec: ${type}/mp4; codecs="${track.mp4track.codec}"`);
                if (typeof this.options.onUnsupportedCodec === 'function') {
                    this.options.onUnsupportedCodec.call(null, track.mp4track.codec);
                }
                return false;
            }
            let sb = this.mediaSource.addSourceBuffer(`${type}/mp4; codecs="${track.mp4track.codec}"`);
            this.bufferControllers[type] = new BufferController(sb, type);
            this.bufferControllers[type].on('error', this.onBufferError.bind(this));
        }
    }

    startInterval() {
        this.interval = setInterval(() => {
            if (this.options.flushingTime) {
                this.applyAndClearBuffer();
            } else if (this.bufferControllers) {
                this.cancelDelay();
            }
        }, this.options.flushingTime || 1000);
    }

    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    cancelDelay() {
        if (this.node.buffered && this.node.buffered.length > 0 && !this.node.seeking) {
            const end = this.node.buffered.end(0);
            if (end - this.node.currentTime > (this.options.maxDelay / 1000)) {
                console.log('delay');
                this.node.currentTime = end - 0.001;
            }
        }
    }

    releaseBuffer() {
        for (let type in this.bufferControllers) {
            this.bufferControllers[type].doAppend();
        }
    }

    applyAndClearBuffer() {
        if (this.bufferControllers) {
            this.releaseBuffer();
            this.clearBuffer();
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
            this.kfPosition = this.kfPosition.filter(kfDelimiter => {
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
        if (this.options.readFpsFromTrack && typeof data.fps !== 'undefined' && this.options.fps != data.fps) {
            this.options.fps = data.fps;
            this.frameDuration = Math.ceil(1000 / data.fps);
            debug.log(`JMuxer changed FPS to ${data.fps} from track data`);
        }
        if (this.env == 'browser') {
            if (this.bufferControllers && this.bufferControllers[data.type]) {
                this.bufferControllers[data.type].feed(data.payload);
            }
        } else if (this.stream) {
            this.stream.push(data.payload);
        }
        if (this.options.onData) {
            this.options.onData(data.payload);
        }
        if (this.options.flushingTime === 0) {
            this.applyAndClearBuffer();
        }
    }

    /* Events on MSE */
    onMSEOpen() {
        this.mseReady = true;
        URL.revokeObjectURL(this.url);
        // this.createBuffer();
        if (typeof this.options.onReady === 'function') {
            this.options.onReady.call(null, this.isReset);
        }
    }

    onMSEClose() {
        this.mseReady = false;
        this.videoStarted = false;
    }

    onBufferError(data) {
        if (data.name == 'QuotaExceeded') {
            debug.log(`JMuxer cleaning ${data.type} buffer due to QuotaExceeded error`);
            this.bufferControllers[data.type].initCleanup(this.node.currentTime);
            return;
        }
        else if (data.name == 'InvalidStateError') {
            debug.log('JMuxer is reseting due to InvalidStateError');
            this.reset();
        }
        else {
            this.endMSE();
        }
        if (typeof this.options.onError === 'function') {
            this.options.onError.call(null, data);
        }
    }
}
