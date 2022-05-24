//import { assert } from 'chai';

import { BaseRemuxer } from '../src/remuxer/base.js';
import { H264Parser } from '../src/parsers/h264.js';
import { AACParser } from '../src/parsers/aac.js';

var h264 = new Uint8Array([0, 0, 0, 1, 103, 66, 192, 30, 218, 2, 128, 191, 229, 192, 90, 128, 128, 131, 32, 0, 0, 3, 0, 32, 0, 0, 7, 129, 226, 197, 212, 0, 0, 0, 1, 113, 76, 122, 37, 218, 2, 128, 191, 229, 192, 90, 128, 128, 131, 32, 0, 0, 3, 0, 32, 0, 0, 70, 129, 126, 195, 202]);
var aac = new Uint8Array([255, 241, 80, 128, 35, 159, 252, 33, 10, 84, 140, 49, 34, 72, 2, 57, 103, 72, 21, 128, 32, 144, 42, 44, 7, 107, 116, 93, 199, 51, 237, 104, 181, 31, 37, 29, 169, 190, 111, 167, 139, 124, 85, 72, 37, 148, 183, 228, 87, 188, 200, 76, 226, 83, 160, 18, 11, 69, 80, 4, 118, 229, 129, 250, 22, 242, 222, 49, 146, 29, 19, 237, 71, 235, 29, 127, 235, 134, 186, 14, 8, 67, 103, 141, 13, 32, 238, 184, 3, 232, 183, 8, 109, 150, 199, 97, 203, 164, 240, 233, 12, 216, 246, 220, 78, 25, 250, 33, 10, 84, 140, 49, 34, 72, 2, 57, 103, 72, 21, 128, 32, 144, 42, 44, 7, 107, 116, 93, 199, 51, 237, 104, 181, 31, 37, 29, 169, 190, 111, 167, 139, 124, 85, 72, 37, 148, 183, 228, 87, 188, 200, 76, 226, 83, 160, 18, 11, 69, 80, 4, 118, 229, 129, 250, 22, 242, 222, 49, 146, 29, 19, 237, 71, 235, 29, 127, 235, 134, 186, 14, 8, 67, 103, 141, 13, 32, 238, 184, 3, 232, 183, 8, 109, 150, 199, 97, 203, 164, 240, 233, 12, 216, 246, 220, 78, 25, 250, 33, 10, 84, 140, 49, 34, 72, 2, 57, 103, 72, 21, 128, 32, 144, 42, 44, 7, 107, 116, 93, 199, 51, 237, 104, 181, 31, 37, 29, 169, 190, 111, 167, 139, 124, 85, 72, 37, 148, 183, 228, 87, 188, 200, 76, 226, 83, 160, 18, 11, 69, 80, 4, 118, 229, 129, 250, 22, 242, 222, 49, 146, 29, 19, 237, 71, 235, 29, 127, 235, 134,33,44,66,34,23]);


describe('Parser tests --', function() {
      
      it('Number of extracted h264 NAL unit should be 2', function() {
         var result = H264Parser.extractNALu(h264);
         assert.equal(result.length, 2);
      });

      it('AAC pattern should return true', function() {
         assert.equal(AACParser.isAACPattern(aac), true); 
      });

      it('AAC header length should be 7 since CRC not present', function() {
         assert.equal(AACParser.getHeaderLength(aac), 7); 
      });

      it('AAC frame length should be 284', function() {
         assert.equal(AACParser.getFrameLength(aac), 284); 
      });
      
      it('Number of extracted AAC frames should be 1', function() {
         const parser = new AACParser(new BaseRemuxer());
         var result = parser.extractAAC(aac);
         assert.equal(result.length, 1); 
      });
});

