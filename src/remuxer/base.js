import * as debug from '../util/debug';
import Event from '../util/event';

let track_id = 1;
export class BaseRemuxer extends Event {

    static getTrackID() {
        return track_id++;
    }

    flush() {
        this.mp4track.len = 0;
        this.mp4track.samples = [];
    }

    isReady() {
        if (!this.readyToDecode || !this.samples.length) return null;
        return true;
    }
}
