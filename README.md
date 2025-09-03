[![Build Status](https://travis-ci.org/samirkumardas/jmuxer.svg?branch=master)](https://travis-ci.org/samirkumardas/jmuxer)
![Maintenance](https://img.shields.io/maintenance/yes/2025.svg)
![license](https://img.shields.io/github/license/mashape/apistatus.svg)

jMuxer
-------
jMuxer - a simple javascript mp4 muxer that works in both browser and node environment. It is communication protocol agnostic and it is intended to play media files on the browser with the help of the media source extension. It also can export mp4 on the node environment. It expects raw H264 video data and/or AAC audio data in ADTS container as an input.

Live Demo
-------
[Click here](https://samirkumardas.github.io/jmuxer/) to view a working demo

[Click here](https://samirkumardas.github.io/jmuxer/h264_player.html) to play a h264 file online

How to use?
-------
   A distribution version is available on dist folder.

```html
  <script type="text/javascript" src="dist/jmuxer.min.js"></script>

  var jmuxer = new JMuxer(option);
```

Available options are:

*node* - String ID of a video tag / Reference of the HTMLVideoElement. Required field for browsers.

*mode* - Available values are: both, video and audio. Default is both

*flushingTime* - Buffer flushing time in milliseconds. Default value is 500 milliseconds. Set `flushingTime` to 0 if you want to flash buffer immediately or find any lag.

*maxDelay* - Maximum delay time in milliseconds. Default value is 500 milliseconds.

*clearBuffer* - true/false. Either it will clear played media buffer automatically or not. Default is true.

*fps* - Optional value. Frame rate of the video if it is known/fixed value. It will be used to find frame duration if chunk duration is not available with provided media data.

*readFpsFromTrack* - true/false. Will read FPS from MP4 track data instead of using (above) fps value. Default is false.

*onReady* - function. Will be called once MSE is ready.

*onData* - function. Will be called when muxed data is ready to be used. First argument is the muxed data.

*onError* - function. Will be fired if jMuxer encounters any buffer related errors.

*onMissingVideoFrames* - function. Will be fired if jMuxer encounters any missing video frames.

*onMissingAudioFrames* - function. Will be fired if jMuxer encounters any missing audio frames.

*debug* - true/false. Will print debug log in browser console. Default is false.

**Complete example:**

```html

   <script type="text/javascript" src="dist/jmuxer.min.js"></script>

   <video id="player"></video>

   <script>
       var jmuxer = new JMuxer({
           node: 'player',
           mode: 'both', /* available values are: both, audio and video */
           debug: false
       });

      /* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */
      jmuxer.feed({
         audio: audio,
         video: video,
         duration: duration
       });

   </script>

```

Media dataObject may have following properties:

*video* - h264 buffer

*audio* - AAC buffer

*duration* - duration in milliseconds of the provided chunk. If duration is not provided, it will calculate frame duration wtih the provided frame rate (fps).

*compositionTimeOffset* - Composition time offset, difference between decode time and presentation time of frames, in milliseconds. This is only used for video and usually needed when B-frames are present in video stream.

**ES6 Example:**

Install module through `npm`

    npm install --save jmuxer

```js

import JMuxer from 'jmuxer';

const jmuxer = new JMuxer({
              node: 'player',
              debug: true
            });

 /* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */
 jmuxer.feed({
      audio: audio,
      video: video,
      duration: duration
 });

```

**Node Example:**

Install module through `npm`

    npm install --save jmuxer

```js

const JMuxer = require('jmuxer');
const jmuxer = new JMuxer({
    debug: true
});

/*
Stream in Object mode. Please check the example file for more details
*/
let h264_feeder = getFeederStreamSomehow();
let http_or_ws_or_any = getWritterStreamSomehow();
h264_feeder.pipe(jmuxer.createStream()).pipe(http_or_ws_or_any);


// OR another way

const jmuxer = new JMuxer({
	onData: function(data) {
		res.write(data); // send data to client
	}
    debug: true
});

jmuxer.feed({
	audio: audio,
	video: video,
	duration: duration
}); // feed data

```

**Available Methods**

| Name        | Parameter           | Remark  |
| ------------- |:-------------:| -----:|
| feed      |  data object      |  object properites may have audio, video and duration. At least one media property i.e audio or video must be provided. If no duration is provided, it will calculate duration based on fps value |
| createStream | -      |    Get a writeable stream to feed buffer. Available on NodeJS only |
| reset | -      |    Reset the jmuxer and start over |
| destroy | -      |    Destroy the jmuxer instance and release the resources |

 **Typescript definition**


    npm install --save @types/jmuxer


 **Compatibility**

 compatible with browsers supporting MSE with 'video/MP4. it is supported on:

 * Chrome for Android 34+
 * Chrome for Desktop 34+
 * Firefox for Android 41+
 * Firefox for Desktop 42+
 * IE11+ for Windows 8.1+
 * Edge for Windows 10+
 * Opera for Desktop
 * Safari for Mac 8+

Demo Server and player example
-----------
Two demos are given:
1. Raw chunks from server, client does the muxing
2. Muxed by server, fMP4 streamed from server

To try them both, in the root directory run
```bash
npm i
npm run dev
```
then navigate to `http://localhost:8080/

You can read further details on how they work in `example/server.mjs`.


How to build?
---------

A distribution version is available inside *dist* directory. However, if you need to build, you can do as follows:

 1. git clone https://github.com/samirkumardas/jmuxer.git
 2. cd jmuxer
 3. npm install
 4. npm run build OR npm run pro

Support
-----------
If the project helps you, [buy me a cup of coffee!](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&currency_code=USD&business=samir@ascendtechnologies.net&item_name=donation%20for%20jMuxer)

Credits
-----------
Proudly inspired by [hls.js](https://github.com/video-dev/hls.js), [rtsp player](https://github.com/Streamedian/html5_rtsp_player)

[Cobrowse.io](https://cobrowse.io/) - for sponsoring the adaptation of jMuxer for Node.js
