import * as debug from '../util/debug';
import Event from '../util/event';
import { appendByteArray } from '../util/utils.js';
import { Readable } from 'stream';
import fs from 'fs';

export default class Mp4Controller extends Event {
    constructor(file) {
        super('buffer');
        this.stream = new Readable({
            read(size) {
            }
        });
        this.export = fs.createWriteStream(file);
        this.export.on('error', function (error) {
            throw 'Unable to create export file - ' + error;
        });
        this.stream.pipe(this.export);
    }

    getStream() {
        return this.stream;
    }

    destroy() {
        this.stream = null;
        this.export.end();
        this.export = null;
        this.offAll();
    }

    feed(data) {
        this.stream.push(data);
    }
}
