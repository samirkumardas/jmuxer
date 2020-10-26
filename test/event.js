//import { assert } from 'chai';
import Event from '../src/util/event.js';

var event = new Event('XYZ');

var callback = function() {
};

describe('event tests --', function() {
      
      beforeEach(function(){
         event.offAll();
         event.on('topic1',callback);
         event.on('topic1',callback);
         event.on('topic2',callback);
      });

      it('listener count should be 2 for the topic1', function() {
         assert.equal(event.listener.topic1.length, 2);
      });

      it('event dispatcher should be return true for a successful dispatcher', function() {
         assert.equal(event.dispatch('topic1', true), true); 
      });

      it('listener count should be zero after removing all listeners', function() {
         event.offAll();
         assert.deepEqual(event.listener, {});
      });
});