import {equal, deepEqual} from 'assert';
import { appendByteArray } from '../src/util/utils.js';

var arr1 = new Uint8Array([1,2,3,4,5]);
var arr2 = new Uint8Array([6,7,8]);

describe('Utils tests --', function() {
      
      it('Appended array length must be 8', function() {
         var result = appendByteArray(arr1, arr2);
         equal(result.byteLength, 8);
      });

      it('8th element value must be 8', function() {
         var result = appendByteArray(arr1, arr2);
         equal(result[7], 8); 
      });
});

