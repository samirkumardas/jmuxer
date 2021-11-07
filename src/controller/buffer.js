import * as debug from '../util/debug';
import Event from '../util/event';
import { appendByteArray } from '../util/utils.js';

export default class BufferController extends Event {
    constructor(sourceBuffer, type) {
        super('buffer');

        this.type = type;
        this.queue = new Uint8Array();

        this.cleaning = false;
        this.pendingCleaning = 0;
        this.cleanOffset = 30;
        this.cleanRanges = [];

        this.sourceBuffer = sourceBuffer;
        this.sourceBuffer.addEventListener('updateend', ()=> {
            if (this.pendingCleaning > 0) {
                this.initCleanup(this.pendingCleaning);
                this.pendingCleaning = 0;
            }
            this.cleaning = false;
            if (this.cleanRanges.length) {
                this.doCleanup();
                return;
            }
        });

        this.sourceBuffer.addEventListener('error', ()=> {
            this.dispatch('error', { type: this.type, name: 'buffer', error: 'buffer error' });
        });
    }

    destroy() {
        this.queue = null;
        this.sourceBuffer = null;
        this.offAll();
    }

    doCleanup() {
        if (!this.cleanRanges.length) {
            this.cleaning = false;
            return;
        }
        let range = this.cleanRanges.shift();
        debug.log(`${this.type} remove range [${range[0]} - ${range[1]})`);
        this.cleaning = true;
        this.sourceBuffer.remove(range[0], range[1]);
    }

    initCleanup(cleanMaxLimit) {
        try {
            if (this.sourceBuffer.updating) {
                this.pendingCleaning = cleanMaxLimit;
                return;
            }
            if (this.sourceBuffer.buffered && this.sourceBuffer.buffered.length && !this.cleaning) {
                for (let i = 0; i < this.sourceBuffer.buffered.length; ++i) {
                    let start = this.sourceBuffer.buffered.start(i);
                    let end = this.sourceBuffer.buffered.end(i);

                    if ((cleanMaxLimit - start) > this.cleanOffset) {
                        end = cleanMaxLimit - this.cleanOffset;
                        if (start < end) {
                            this.cleanRanges.push([start, end]);
                        }
                    }
                }
                this.doCleanup();
            }
        } catch (e) {
            debug.error(`Error occured while cleaning ${this.type} buffer - ${e.name}: ${e.message}`);
        }
    }

    doAppend() {
        if (!this.queue.length) return;

        if (!this.sourceBuffer || this.sourceBuffer.updating) return;

        try {
            this.sourceBuffer.appendBuffer(this.queue);
            this.queue = new Uint8Array();
        } catch (e) {
            let name = 'unexpectedError';
            if (e.name === 'QuotaExceededError') {
                debug.log(`${this.type} buffer quota full`);
                name = 'QuotaExceeded';
            } else {
                debug.error(`Error occured while appending ${this.type} buffer - ${e.name}: ${e.message}`);
                name = 'InvalidStateError';
            }
            this.dispatch('error', { type: this.type, name: name, error: 'buffer error' });
        }
    }

    feed(data) {
        this.queue = appendByteArray(this.queue, data);
    }
}
