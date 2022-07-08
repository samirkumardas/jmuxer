(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('stream')) :
  typeof define === 'function' && define.amd ? define(['stream'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.JMuxer = factory(global.stream));
})(this, (function (stream) { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];

    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var logger;
  var errorLogger;
  function setLogger() {
    /*eslint-disable */
    logger = console.log;
    errorLogger = console.error;
    /*eslint-enable */
  }
  function log(message) {
    if (logger) {
      for (var _len = arguments.length, optionalParams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        optionalParams[_key - 1] = arguments[_key];
      }

      logger.apply(void 0, [message].concat(optionalParams));
    }
  }
  function error(message) {
    if (errorLogger) {
      for (var _len2 = arguments.length, optionalParams = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        optionalParams[_key2 - 1] = arguments[_key2];
      }

      errorLogger.apply(void 0, [message].concat(optionalParams));
    }
  }

  var NALU = /*#__PURE__*/function () {
    function NALU(data) {
      _classCallCheck(this, NALU);

      this.payload = data;
      this.nri = (this.payload[0] & 0x60) >> 5; // nal_ref_idc

      this.ntype = this.payload[0] & 0x1f;
      this.isvcl = this.ntype == 1 || this.ntype == 5;
      this.stype = ''; // slice_type

      this.isfmb = false; // first_mb_in_slice
    }

    _createClass(NALU, [{
      key: "toString",
      value: function toString() {
        return "".concat(NALU.type(this), ": NRI: ").concat(this.getNri());
      }
    }, {
      key: "getNri",
      value: function getNri() {
        return this.nri;
      }
    }, {
      key: "type",
      value: function type() {
        return this.ntype;
      }
    }, {
      key: "isKeyframe",
      value: function isKeyframe() {
        return this.ntype === NALU.IDR;
      }
    }, {
      key: "getPayload",
      value: function getPayload() {
        return this.payload;
      }
    }, {
      key: "getPayloadSize",
      value: function getPayloadSize() {
        return this.payload.byteLength;
      }
    }, {
      key: "getSize",
      value: function getSize() {
        return 4 + this.getPayloadSize();
      }
    }, {
      key: "getData",
      value: function getData() {
        var result = new Uint8Array(this.getSize());
        var view = new DataView(result.buffer);
        view.setUint32(0, this.getSize() - 4);
        result.set(this.getPayload(), 4);
        return result;
      }
    }], [{
      key: "NDR",
      get: function get() {
        return 1;
      }
    }, {
      key: "IDR",
      get: function get() {
        return 5;
      }
    }, {
      key: "SEI",
      get: function get() {
        return 6;
      }
    }, {
      key: "SPS",
      get: function get() {
        return 7;
      }
    }, {
      key: "PPS",
      get: function get() {
        return 8;
      }
    }, {
      key: "AUD",
      get: function get() {
        return 9;
      }
    }, {
      key: "TYPES",
      get: function get() {
        var _ref;

        return _ref = {}, _defineProperty(_ref, NALU.IDR, 'IDR'), _defineProperty(_ref, NALU.SEI, 'SEI'), _defineProperty(_ref, NALU.SPS, 'SPS'), _defineProperty(_ref, NALU.PPS, 'PPS'), _defineProperty(_ref, NALU.NDR, 'NDR'), _defineProperty(_ref, NALU.AUD, 'AUD'), _ref;
      }
    }, {
      key: "type",
      value: function type(nalu) {
        if (nalu.ntype in NALU.TYPES) {
          return NALU.TYPES[nalu.ntype];
        } else {
          return 'UNKNOWN';
        }
      }
    }]);

    return NALU;
  }();

  function appendByteArray(buffer1, buffer2) {
    var tmp = new Uint8Array((buffer1.byteLength | 0) + (buffer2.byteLength | 0));
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.byteLength | 0);
    return tmp;
  }
  function secToTime(sec) {
    var seconds,
        hours,
        minutes,
        result = '';
    seconds = Math.floor(sec);
    hours = parseInt(seconds / 3600, 10) % 24;
    minutes = parseInt(seconds / 60, 10) % 60;
    seconds = seconds < 0 ? 0 : seconds % 60;

    if (hours > 0) {
      result += (hours < 10 ? '0' + hours : hours) + ':';
    }

    result += (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
    return result;
  }

  /**
   * Parser for exponential Golomb codes, a variable-bitwidth number encoding scheme used by h264.
  */
  var ExpGolomb = /*#__PURE__*/function () {
    function ExpGolomb(data) {
      _classCallCheck(this, ExpGolomb);

      this.data = data;
      this.index = 0;
      this.bitLength = data.byteLength * 8;
    }

    _createClass(ExpGolomb, [{
      key: "setData",
      value: function setData(data) {
        this.data = data;
        this.index = 0;
        this.bitLength = data.byteLength * 8;
      }
    }, {
      key: "bitsAvailable",
      get: function get() {
        return this.bitLength - this.index;
      }
    }, {
      key: "skipBits",
      value: function skipBits(size) {
        // console.log(`  skip bits: size=${size}, ${this.index}.`);
        if (this.bitsAvailable < size) {
          //throw new Error('no bytes available');
          return false;
        }

        this.index += size;
      }
    }, {
      key: "readBits",
      value: function readBits(size) {
        var moveIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        // console.log(`  read bits: size=${size}, ${this.index}.`);
        var result = this.getBits(size, this.index, moveIndex); // console.log(`    read bits: result=${result}`);

        return result;
      }
    }, {
      key: "getBits",
      value: function getBits(size, offsetBits) {
        var moveIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        if (this.bitsAvailable < size) {
          //throw new Error('no bytes available');
          return 0;
        }

        var offset = offsetBits % 8;

        var _byte = this.data[offsetBits / 8 | 0] & 0xff >>> offset;

        var bits = 8 - offset;

        if (bits >= size) {
          if (moveIndex) {
            this.index += size;
          }

          return _byte >> bits - size;
        } else {
          if (moveIndex) {
            this.index += bits;
          }

          var nextSize = size - bits;
          return _byte << nextSize | this.getBits(nextSize, offsetBits + bits, moveIndex);
        }
      }
    }, {
      key: "skipLZ",
      value: function skipLZ() {
        var leadingZeroCount;

        for (leadingZeroCount = 0; leadingZeroCount < this.bitLength - this.index; ++leadingZeroCount) {
          if (this.getBits(1, this.index + leadingZeroCount, false) !== 0) {
            // console.log(`  skip LZ  : size=${leadingZeroCount}, ${this.index}.`);
            this.index += leadingZeroCount;
            return leadingZeroCount;
          }
        }

        return leadingZeroCount;
      }
    }, {
      key: "skipUEG",
      value: function skipUEG() {
        this.skipBits(1 + this.skipLZ());
      }
    }, {
      key: "skipEG",
      value: function skipEG() {
        this.skipBits(1 + this.skipLZ());
      }
    }, {
      key: "readUEG",
      value: function readUEG() {
        var prefix = this.skipLZ();
        return this.readBits(prefix + 1) - 1;
      }
    }, {
      key: "readEG",
      value: function readEG() {
        var value = this.readUEG();

        if (0x01 & value) {
          // the number is odd if the low order bit is set
          return 1 + value >>> 1; // add 1 to make it even, and divide by 2
        } else {
          return -1 * (value >>> 1); // divide by two then make it negative
        }
      }
    }, {
      key: "readBoolean",
      value: function readBoolean() {
        return this.readBits(1) === 1;
      }
    }, {
      key: "readUByte",
      value: function readUByte() {
        var numberOfBytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        return this.readBits(numberOfBytes * 8);
      }
    }, {
      key: "readUShort",
      value: function readUShort() {
        return this.readBits(16);
      }
    }, {
      key: "readUInt",
      value: function readUInt() {
        return this.readBits(32);
      }
    }]);

    return ExpGolomb;
  }();

  var H264Parser = /*#__PURE__*/function () {
    function H264Parser(remuxer) {
      _classCallCheck(this, H264Parser);

      this.remuxer = remuxer;
      this.track = remuxer.mp4track;
    }

    _createClass(H264Parser, [{
      key: "parseSPS",
      value: function parseSPS(sps) {
        var config = H264Parser.readSPS(new Uint8Array(sps));
        this.track.fps = config.fps;
        this.track.width = config.width;
        this.track.height = config.height;
        this.track.sps = [new Uint8Array(sps)];
        this.track.codec = 'avc1.';
        var codecarray = new DataView(sps.buffer, sps.byteOffset + 1, 4);

        for (var i = 0; i < 3; ++i) {
          var h = codecarray.getUint8(i).toString(16);

          if (h.length < 2) {
            h = '0' + h;
          }

          this.track.codec += h;
        }
      }
    }, {
      key: "parsePPS",
      value: function parsePPS(pps) {
        this.track.pps = [new Uint8Array(pps)];
      }
    }, {
      key: "parseNAL",
      value: function parseNAL(unit) {
        if (!unit) return false;
        var push = false;

        switch (unit.type()) {
          case NALU.IDR:
          case NALU.NDR:
            push = true;
            break;

          case NALU.PPS:
            if (!this.track.pps) {
              this.parsePPS(unit.getPayload());

              if (!this.remuxer.readyToDecode && this.track.pps && this.track.sps) {
                this.remuxer.readyToDecode = true;
              }
            }

            push = true;
            break;

          case NALU.SPS:
            if (!this.track.sps) {
              this.parseSPS(unit.getPayload());

              if (!this.remuxer.readyToDecode && this.track.pps && this.track.sps) {
                this.remuxer.readyToDecode = true;
              }
            }

            push = true;
            break;

          case NALU.AUD:
            log('AUD - ignoing');
            break;

          case NALU.SEI:
            log('SEI - ignoing');
            break;
        }

        return push;
      }
    }], [{
      key: "extractNALu",
      value: function extractNALu(buffer) {
        var i = 0,
            length = buffer.byteLength,
            value,
            state = 0,
            result = [],
            left,
            lastIndex = 0;

        while (i < length) {
          value = buffer[i++]; // finding 3 or 4-byte start codes (00 00 01 OR 00 00 00 01)

          switch (state) {
            case 0:
              if (value === 0) {
                state = 1;
              }

              break;

            case 1:
              if (value === 0) {
                state = 2;
              } else {
                state = 0;
              }

              break;

            case 2:
            case 3:
              if (value === 0) {
                state = 3;
              } else if (value === 1 && i < length) {
                if (lastIndex != i - state - 1) {
                  result.push(buffer.subarray(lastIndex, i - state - 1));
                }

                lastIndex = i;
                state = 0;
              } else {
                state = 0;
              }

              break;
          }
        }

        if (lastIndex < length) {
          left = buffer.subarray(lastIndex, length);
        }

        return [result, left];
      }
      /**
       * Advance the ExpGolomb decoder past a scaling list. The scaling
       * list is optionally transmitted as part of a sequence parameter
       * set and is not relevant to transmuxing.
       * @param decoder {ExpGolomb} exp golomb decoder
       * @param count {number} the number of entries in this scaling list
       * @see Recommendation ITU-T H.264, Section 7.3.2.1.1.1
       */

    }, {
      key: "skipScalingList",
      value: function skipScalingList(decoder, count) {
        var lastScale = 8,
            nextScale = 8,
            deltaScale;

        for (var j = 0; j < count; j++) {
          if (nextScale !== 0) {
            deltaScale = decoder.readEG();
            nextScale = (lastScale + deltaScale + 256) % 256;
          }

          lastScale = nextScale === 0 ? lastScale : nextScale;
        }
      }
      /**
       * Read a sequence parameter set and return some interesting video
       * properties. A sequence parameter set is the H264 metadata that
       * describes the properties of upcoming video frames.
       * @param data {Uint8Array} the bytes of a sequence parameter set
       * @return {object} an object with configuration parsed from the
       * sequence parameter set, including the dimensions of the
       * associated video frames.
       */

    }, {
      key: "readSPS",
      value: function readSPS(data) {
        var decoder = new ExpGolomb(data);
        var frameCropLeftOffset = 0,
            frameCropRightOffset = 0,
            frameCropTopOffset = 0,
            frameCropBottomOffset = 0,
            sarScale = 1,
            profileIdc,
            numRefFramesInPicOrderCntCycle,
            picWidthInMbsMinus1,
            picHeightInMapUnitsMinus1,
            frameMbsOnlyFlag,
            scalingListCount,
            fps = 0;
        decoder.readUByte(); // skip NAL header
        // rewrite NAL

        var rbsp = [],
            hdr_bytes = 1,
            nal_bytes = data.byteLength;

        for (var i = hdr_bytes; i < nal_bytes; i++) {
          if (i + 2 < nal_bytes && decoder.readBits(24, false) === 0x000003) {
            rbsp.push(decoder.readBits(8));
            rbsp.push(decoder.readBits(8));
            i += 2; // emulation_prevention_three_byte

            decoder.readBits(8);
          } else {
            rbsp.push(decoder.readBits(8));
          }
        }

        decoder.setData(new Uint8Array(rbsp)); // end of rewrite data

        profileIdc = decoder.readUByte(); // profile_idc

        decoder.readBits(5); // constraint_set[0-4]_flag, u(5)

        decoder.skipBits(3); // reserved_zero_3bits u(3),

        decoder.readUByte(); // level_idc u(8)

        decoder.skipUEG(); // seq_parameter_set_id
        // some profiles have more optional data we don't need

        if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
          var chromaFormatIdc = decoder.readUEG();

          if (chromaFormatIdc === 3) {
            decoder.skipBits(1); // separate_colour_plane_flag
          }

          decoder.skipUEG(); // bit_depth_luma_minus8

          decoder.skipUEG(); // bit_depth_chroma_minus8

          decoder.skipBits(1); // qpprime_y_zero_transform_bypass_flag

          if (decoder.readBoolean()) {
            // seq_scaling_matrix_present_flag
            scalingListCount = chromaFormatIdc !== 3 ? 8 : 12;

            for (var _i = 0; _i < scalingListCount; ++_i) {
              if (decoder.readBoolean()) {
                // seq_scaling_list_present_flag[ i ]
                if (_i < 6) {
                  H264Parser.skipScalingList(decoder, 16);
                } else {
                  H264Parser.skipScalingList(decoder, 64);
                }
              }
            }
          }
        }

        decoder.skipUEG(); // log2_max_frame_num_minus4

        var picOrderCntType = decoder.readUEG();

        if (picOrderCntType === 0) {
          decoder.readUEG(); // log2_max_pic_order_cnt_lsb_minus4
        } else if (picOrderCntType === 1) {
          decoder.skipBits(1); // delta_pic_order_always_zero_flag

          decoder.skipEG(); // offset_for_non_ref_pic

          decoder.skipEG(); // offset_for_top_to_bottom_field

          numRefFramesInPicOrderCntCycle = decoder.readUEG();

          for (var _i2 = 0; _i2 < numRefFramesInPicOrderCntCycle; ++_i2) {
            decoder.skipEG(); // offset_for_ref_frame[ i ]
          }
        }

        decoder.skipUEG(); // max_num_ref_frames

        decoder.skipBits(1); // gaps_in_frame_num_value_allowed_flag

        picWidthInMbsMinus1 = decoder.readUEG();
        picHeightInMapUnitsMinus1 = decoder.readUEG();
        frameMbsOnlyFlag = decoder.readBits(1);

        if (frameMbsOnlyFlag === 0) {
          decoder.skipBits(1); // mb_adaptive_frame_field_flag
        }

        decoder.skipBits(1); // direct_8x8_inference_flag

        if (decoder.readBoolean()) {
          // frame_cropping_flag
          frameCropLeftOffset = decoder.readUEG();
          frameCropRightOffset = decoder.readUEG();
          frameCropTopOffset = decoder.readUEG();
          frameCropBottomOffset = decoder.readUEG();
        }

        if (decoder.readBoolean()) {
          // vui_parameters_present_flag
          if (decoder.readBoolean()) {
            // aspect_ratio_info_present_flag
            var sarRatio;
            var aspectRatioIdc = decoder.readUByte();

            switch (aspectRatioIdc) {
              case 1:
                sarRatio = [1, 1];
                break;

              case 2:
                sarRatio = [12, 11];
                break;

              case 3:
                sarRatio = [10, 11];
                break;

              case 4:
                sarRatio = [16, 11];
                break;

              case 5:
                sarRatio = [40, 33];
                break;

              case 6:
                sarRatio = [24, 11];
                break;

              case 7:
                sarRatio = [20, 11];
                break;

              case 8:
                sarRatio = [32, 11];
                break;

              case 9:
                sarRatio = [80, 33];
                break;

              case 10:
                sarRatio = [18, 11];
                break;

              case 11:
                sarRatio = [15, 11];
                break;

              case 12:
                sarRatio = [64, 33];
                break;

              case 13:
                sarRatio = [160, 99];
                break;

              case 14:
                sarRatio = [4, 3];
                break;

              case 15:
                sarRatio = [3, 2];
                break;

              case 16:
                sarRatio = [2, 1];
                break;

              case 255:
                {
                  sarRatio = [decoder.readUByte() << 8 | decoder.readUByte(), decoder.readUByte() << 8 | decoder.readUByte()];
                  break;
                }
            }

            if (sarRatio && sarRatio[0] > 0 && sarRatio[1] > 0) {
              sarScale = sarRatio[0] / sarRatio[1];
            }
          }

          if (decoder.readBoolean()) {
            decoder.skipBits(1);
          }

          if (decoder.readBoolean()) {
            decoder.skipBits(4);

            if (decoder.readBoolean()) {
              decoder.skipBits(24);
            }
          }

          if (decoder.readBoolean()) {
            decoder.skipUEG();
            decoder.skipUEG();
          }

          if (decoder.readBoolean()) {
            var unitsInTick = decoder.readUInt();
            var timeScale = decoder.readUInt();
            var fixedFrameRate = decoder.readBoolean();
            var frameDuration = timeScale / (2 * unitsInTick);

            if (fixedFrameRate) {
              fps = frameDuration;
            }
          }
        }

        return {
          fps: fps > 0 ? fps : undefined,
          width: Math.ceil(((picWidthInMbsMinus1 + 1) * 16 - frameCropLeftOffset * 2 - frameCropRightOffset * 2) * sarScale),
          height: (2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16 - (frameMbsOnlyFlag ? 2 : 4) * (frameCropTopOffset + frameCropBottomOffset)
        };
      }
    }, {
      key: "parseHeader",
      value: function parseHeader(unit) {
        var decoder = new ExpGolomb(unit.getPayload()); // skip NALu type

        decoder.readUByte();
        unit.isfmb = decoder.readUEG() === 0;
        unit.stype = decoder.readUEG();
      }
    }]);

    return H264Parser;
  }();

  var AACParser = /*#__PURE__*/function () {
    function AACParser(remuxer) {
      _classCallCheck(this, AACParser);

      this.remuxer = remuxer;
      this.track = remuxer.mp4track;
    }

    _createClass(AACParser, [{
      key: "extractAAC",
      value: function extractAAC(buffer) {
        var i = 0,
            length = buffer.byteLength,
            result = [],
            headerLength,
            frameLength;

        if (!AACParser.isAACPattern(buffer)) {
          error('Invalid ADTS audio format');
          return result;
        }

        headerLength = AACParser.getHeaderLength(buffer);

        if (!this.aacHeader) {
          this.aacHeader = buffer.subarray(0, headerLength);
        }

        while (i < length) {
          frameLength = AACParser.getFrameLength(buffer);
          result.push(buffer.subarray(headerLength, frameLength));
          buffer = buffer.slice(frameLength);
          i += frameLength;
        }

        return result;
      }
    }, {
      key: "setAACConfig",
      value: function setAACConfig() {
        var objectType,
            sampleIndex,
            channelCount,
            config = new Uint8Array(2),
            headerData = this.aacHeader;
        if (!headerData) return;
        objectType = ((headerData[2] & 0xC0) >>> 6) + 1;
        sampleIndex = (headerData[2] & 0x3C) >>> 2;
        channelCount = (headerData[2] & 0x01) << 2;
        channelCount |= (headerData[3] & 0xC0) >>> 6;
        /* refer to http://wiki.multimedia.cx/index.php?title=MPEG-4_Audio#Audio_Specific_Config */

        config[0] = objectType << 3;
        config[0] |= (sampleIndex & 0x0E) >> 1;
        config[1] |= (sampleIndex & 0x01) << 7;
        config[1] |= channelCount << 3;
        this.track.codec = 'mp4a.40.' + objectType;
        this.track.channelCount = channelCount;
        this.track.config = config;
        this.remuxer.readyToDecode = true;
      }
    }], [{
      key: "samplingRateMap",
      get: function get() {
        return [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
      }
    }, {
      key: "getHeaderLength",
      value: function getHeaderLength(data) {
        return data[1] & 0x01 ? 7 : 9; // without CRC 7 and with CRC 9 Refs: https://wiki.multimedia.cx/index.php?title=ADTS
      }
    }, {
      key: "getFrameLength",
      value: function getFrameLength(data) {
        return (data[3] & 0x03) << 11 | data[4] << 3 | (data[5] & 0xE0) >>> 5; // 13 bits length ref: https://wiki.multimedia.cx/index.php?title=ADTS
      }
    }, {
      key: "isAACPattern",
      value: function isAACPattern(data) {
        return data[0] === 0xff && (data[1] & 0xf0) === 0xf0 && (data[1] & 0x06) === 0x00;
      }
    }]);

    return AACParser;
  }();

  var Event = /*#__PURE__*/function () {
    function Event(type) {
      _classCallCheck(this, Event);

      this.listener = {};
      this.type = type | '';
    }

    _createClass(Event, [{
      key: "on",
      value: function on(event, fn) {
        if (!this.listener[event]) {
          this.listener[event] = [];
        }

        this.listener[event].push(fn);
        return true;
      }
    }, {
      key: "off",
      value: function off(event, fn) {
        if (this.listener[event]) {
          var index = this.listener[event].indexOf(fn);

          if (index > -1) {
            this.listener[event].splice(index, 1);
          }

          return true;
        }

        return false;
      }
    }, {
      key: "offAll",
      value: function offAll() {
        this.listener = {};
      }
    }, {
      key: "dispatch",
      value: function dispatch(event, data) {
        if (this.listener[event]) {
          this.listener[event].map(function (each) {
            each.apply(null, [data]);
          });
          return true;
        }

        return false;
      }
    }]);

    return Event;
  }();

  /**
   * Generate MP4 Box
   * taken from: https://github.com/dailymotion/hls.js
   */
  var MP4 = /*#__PURE__*/function () {
    function MP4() {
      _classCallCheck(this, MP4);
    }

    _createClass(MP4, null, [{
      key: "init",
      value: function init() {
        MP4.types = {
          avc1: [],
          // codingname
          avcC: [],
          btrt: [],
          dinf: [],
          dref: [],
          esds: [],
          ftyp: [],
          hdlr: [],
          mdat: [],
          mdhd: [],
          mdia: [],
          mfhd: [],
          minf: [],
          moof: [],
          moov: [],
          mp4a: [],
          mvex: [],
          mvhd: [],
          sdtp: [],
          stbl: [],
          stco: [],
          stsc: [],
          stsd: [],
          stsz: [],
          stts: [],
          tfdt: [],
          tfhd: [],
          traf: [],
          trak: [],
          trun: [],
          trex: [],
          tkhd: [],
          vmhd: [],
          smhd: []
        };
        var i;

        for (i in MP4.types) {
          if (MP4.types.hasOwnProperty(i)) {
            MP4.types[i] = [i.charCodeAt(0), i.charCodeAt(1), i.charCodeAt(2), i.charCodeAt(3)];
          }
        }

        var videoHdlr = new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x00, // pre_defined
        0x76, 0x69, 0x64, 0x65, // handler_type: 'vide'
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x56, 0x69, 0x64, 0x65, 0x6f, 0x48, 0x61, 0x6e, 0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'VideoHandler'
        ]);
        var audioHdlr = new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x00, // pre_defined
        0x73, 0x6f, 0x75, 0x6e, // handler_type: 'soun'
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x53, 0x6f, 0x75, 0x6e, 0x64, 0x48, 0x61, 0x6e, 0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'SoundHandler'
        ]);
        MP4.HDLR_TYPES = {
          video: videoHdlr,
          audio: audioHdlr
        };
        var dref = new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x01, // entry_count
        0x00, 0x00, 0x00, 0x0c, // entry_size
        0x75, 0x72, 0x6c, 0x20, // 'url' type
        0x00, // version 0
        0x00, 0x00, 0x01 // entry_flags
        ]);
        var stco = new Uint8Array([0x00, // version
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x00 // entry_count
        ]);
        MP4.STTS = MP4.STSC = MP4.STCO = stco;
        MP4.STSZ = new Uint8Array([0x00, // version
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x00, // sample_size
        0x00, 0x00, 0x00, 0x00 // sample_count
        ]);
        MP4.VMHD = new Uint8Array([0x00, // version
        0x00, 0x00, 0x01, // flags
        0x00, 0x00, // graphicsmode
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // opcolor
        ]);
        MP4.SMHD = new Uint8Array([0x00, // version
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, // balance
        0x00, 0x00 // reserved
        ]);
        MP4.STSD = new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x01]); // entry_count

        var majorBrand = new Uint8Array([105, 115, 111, 109]); // isom

        var avc1Brand = new Uint8Array([97, 118, 99, 49]); // avc1

        var minorVersion = new Uint8Array([0, 0, 0, 1]);
        MP4.FTYP = MP4.box(MP4.types.ftyp, majorBrand, minorVersion, majorBrand, avc1Brand);
        MP4.DINF = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, dref));
      }
    }, {
      key: "box",
      value: function box(type) {
        for (var _len = arguments.length, payload = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          payload[_key - 1] = arguments[_key];
        }

        var size = 8,
            i = payload.length,
            len = i,
            result; // calculate the total size we need to allocate

        while (i--) {
          size += payload[i].byteLength;
        }

        result = new Uint8Array(size);
        result[0] = size >> 24 & 0xff;
        result[1] = size >> 16 & 0xff;
        result[2] = size >> 8 & 0xff;
        result[3] = size & 0xff;
        result.set(type, 4); // copy the payload into the result

        for (i = 0, size = 8; i < len; ++i) {
          // copy payload[i] array @ offset size
          result.set(payload[i], size);
          size += payload[i].byteLength;
        }

        return result;
      }
    }, {
      key: "hdlr",
      value: function hdlr(type) {
        return MP4.box(MP4.types.hdlr, MP4.HDLR_TYPES[type]);
      }
    }, {
      key: "mdat",
      value: function mdat(data) {
        return MP4.box(MP4.types.mdat, data);
      }
    }, {
      key: "mdhd",
      value: function mdhd(timescale, duration) {
        return MP4.box(MP4.types.mdhd, new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x02, // creation_time
        0x00, 0x00, 0x00, 0x03, // modification_time
        timescale >> 24 & 0xFF, timescale >> 16 & 0xFF, timescale >> 8 & 0xFF, timescale & 0xFF, // timescale
        duration >> 24, duration >> 16 & 0xFF, duration >> 8 & 0xFF, duration & 0xFF, // duration
        0x55, 0xc4, // 'und' language (undetermined)
        0x00, 0x00]));
      }
    }, {
      key: "mdia",
      value: function mdia(track) {
        return MP4.box(MP4.types.mdia, MP4.mdhd(track.timescale, track.duration), MP4.hdlr(track.type), MP4.minf(track));
      }
    }, {
      key: "mfhd",
      value: function mfhd(sequenceNumber) {
        return MP4.box(MP4.types.mfhd, new Uint8Array([0x00, 0x00, 0x00, 0x00, // flags
        sequenceNumber >> 24, sequenceNumber >> 16 & 0xFF, sequenceNumber >> 8 & 0xFF, sequenceNumber & 0xFF // sequence_number
        ]));
      }
    }, {
      key: "minf",
      value: function minf(track) {
        if (track.type === 'audio') {
          return MP4.box(MP4.types.minf, MP4.box(MP4.types.smhd, MP4.SMHD), MP4.DINF, MP4.stbl(track));
        } else {
          return MP4.box(MP4.types.minf, MP4.box(MP4.types.vmhd, MP4.VMHD), MP4.DINF, MP4.stbl(track));
        }
      }
    }, {
      key: "moof",
      value: function moof(sn, baseMediaDecodeTime, track) {
        return MP4.box(MP4.types.moof, MP4.mfhd(sn), MP4.traf(track, baseMediaDecodeTime));
      }
      /**
       * @param tracks... (optional) {array} the tracks associated with this movie
       */

    }, {
      key: "moov",
      value: function moov(tracks, duration, timescale) {
        var i = tracks.length,
            boxes = [];

        while (i--) {
          boxes[i] = MP4.trak(tracks[i]);
        }

        return MP4.box.apply(null, [MP4.types.moov, MP4.mvhd(timescale, duration)].concat(boxes).concat(MP4.mvex(tracks)));
      }
    }, {
      key: "mvex",
      value: function mvex(tracks) {
        var i = tracks.length,
            boxes = [];

        while (i--) {
          boxes[i] = MP4.trex(tracks[i]);
        }

        return MP4.box.apply(null, [MP4.types.mvex].concat(boxes));
      }
    }, {
      key: "mvhd",
      value: function mvhd(timescale, duration) {
        var bytes = new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x00, 0x00, 0x00, 0x01, // creation_time
        0x00, 0x00, 0x00, 0x02, // modification_time
        timescale >> 24 & 0xFF, timescale >> 16 & 0xFF, timescale >> 8 & 0xFF, timescale & 0xFF, // timescale
        duration >> 24 & 0xFF, duration >> 16 & 0xFF, duration >> 8 & 0xFF, duration & 0xFF, // duration
        0x00, 0x01, 0x00, 0x00, // 1.0 rate
        0x01, 0x00, // 1.0 volume
        0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // pre_defined
        0xff, 0xff, 0xff, 0xff // next_track_ID
        ]);
        return MP4.box(MP4.types.mvhd, bytes);
      }
    }, {
      key: "sdtp",
      value: function sdtp(track) {
        var samples = track.samples || [],
            bytes = new Uint8Array(4 + samples.length),
            flags,
            i; // leave the full box header (4 bytes) all zero
        // write the sample table

        for (i = 0; i < samples.length; i++) {
          flags = samples[i].flags;
          bytes[i + 4] = flags.dependsOn << 4 | flags.isDependedOn << 2 | flags.hasRedundancy;
        }

        return MP4.box(MP4.types.sdtp, bytes);
      }
    }, {
      key: "stbl",
      value: function stbl(track) {
        return MP4.box(MP4.types.stbl, MP4.stsd(track), MP4.box(MP4.types.stts, MP4.STTS), MP4.box(MP4.types.stsc, MP4.STSC), MP4.box(MP4.types.stsz, MP4.STSZ), MP4.box(MP4.types.stco, MP4.STCO));
      }
    }, {
      key: "avc1",
      value: function avc1(track) {
        var sps = [],
            pps = [],
            i,
            data,
            len; // assemble the SPSs

        for (i = 0; i < track.sps.length; i++) {
          data = track.sps[i];
          len = data.byteLength;
          sps.push(len >>> 8 & 0xFF);
          sps.push(len & 0xFF);
          sps = sps.concat(Array.prototype.slice.call(data)); // SPS
        } // assemble the PPSs


        for (i = 0; i < track.pps.length; i++) {
          data = track.pps[i];
          len = data.byteLength;
          pps.push(len >>> 8 & 0xFF);
          pps.push(len & 0xFF);
          pps = pps.concat(Array.prototype.slice.call(data));
        }

        var avcc = MP4.box(MP4.types.avcC, new Uint8Array([0x01, // version
        sps[3], // profile
        sps[4], // profile compat
        sps[5], // level
        0xfc | 3, // lengthSizeMinusOne, hard-coded to 4 bytes
        0xE0 | track.sps.length // 3bit reserved (111) + numOfSequenceParameterSets
        ].concat(sps).concat([track.pps.length // numOfPictureParameterSets
        ]).concat(pps))),
            // "PPS"
        width = track.width,
            height = track.height; // console.log('avcc:' + Hex.hexDump(avcc));

        return MP4.box(MP4.types.avc1, new Uint8Array([0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, // reserved
        0x00, 0x01, // data_reference_index
        0x00, 0x00, // pre_defined
        0x00, 0x00, // reserved
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // pre_defined
        width >> 8 & 0xFF, width & 0xff, // width
        height >> 8 & 0xFF, height & 0xff, // height
        0x00, 0x48, 0x00, 0x00, // horizresolution
        0x00, 0x48, 0x00, 0x00, // vertresolution
        0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x01, // frame_count
        0x12, 0x62, 0x69, 0x6E, 0x65, // binelpro.ru
        0x6C, 0x70, 0x72, 0x6F, 0x2E, 0x72, 0x75, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // compressorname
        0x00, 0x18, // depth = 24
        0x11, 0x11]), // pre_defined = -1
        avcc, MP4.box(MP4.types.btrt, new Uint8Array([0x00, 0x1c, 0x9c, 0x80, // bufferSizeDB
        0x00, 0x2d, 0xc6, 0xc0, // maxBitrate
        0x00, 0x2d, 0xc6, 0xc0])) // avgBitrate
        );
      }
    }, {
      key: "esds",
      value: function esds(track) {
        var configlen = track.config.byteLength;
        var data = new Uint8Array(26 + configlen + 3);
        data.set([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        0x03, // descriptor_type
        0x17 + configlen, // length
        0x00, 0x01, // es_id
        0x00, // stream_priority
        0x04, // descriptor_type
        0x0f + configlen, // length
        0x40, // codec : mpeg4_audio
        0x15, // stream_type
        0x00, 0x00, 0x00, // buffer_size
        0x00, 0x00, 0x00, 0x00, // maxBitrate
        0x00, 0x00, 0x00, 0x00, // avgBitrate
        0x05, // descriptor_type
        configlen]);
        data.set(track.config, 26);
        data.set([0x06, 0x01, 0x02], 26 + configlen); // return new Uint8Array([
        //     0x00, // version 0
        //     0x00, 0x00, 0x00, // flags
        //
        //     0x03, // descriptor_type
        //     0x17+configlen, // length
        //     0x00, 0x01, //es_id
        //     0x00, // stream_priority
        //
        //     0x04, // descriptor_type
        //     0x0f+configlen, // length
        //     0x40, //codec : mpeg4_audio
        //     0x15, // stream_type
        //     0x00, 0x00, 0x00, // buffer_size
        //     0x00, 0x00, 0x00, 0x00, // maxBitrate
        //     0x00, 0x00, 0x00, 0x00, // avgBitrate
        //
        //     0x05 // descriptor_type
        // ].concat([configlen]).concat(track.config).concat([0x06, 0x01, 0x02])); // GASpecificConfig)); // length + audio config descriptor

        return data;
      }
    }, {
      key: "mp4a",
      value: function mp4a(track) {
        var audiosamplerate = track.audiosamplerate;
        return MP4.box(MP4.types.mp4a, new Uint8Array([0x00, 0x00, 0x00, // reserved
        0x00, 0x00, 0x00, // reserved
        0x00, 0x01, // data_reference_index
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // reserved
        0x00, track.channelCount, // channelcount
        0x00, 0x10, // sampleSize:16bits
        0x00, 0x00, // pre_defined
        0x00, 0x00, // reserved2
        audiosamplerate >> 8 & 0xFF, audiosamplerate & 0xff, //
        0x00, 0x00]), MP4.box(MP4.types.esds, MP4.esds(track)));
      }
    }, {
      key: "stsd",
      value: function stsd(track) {
        if (track.type === 'audio') {
          return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp4a(track));
        } else {
          return MP4.box(MP4.types.stsd, MP4.STSD, MP4.avc1(track));
        }
      }
    }, {
      key: "tkhd",
      value: function tkhd(track) {
        var id = track.id,
            duration = track.duration,
            width = track.width,
            height = track.height,
            volume = track.volume;
        return MP4.box(MP4.types.tkhd, new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x07, // flags
        0x00, 0x00, 0x00, 0x00, // creation_time
        0x00, 0x00, 0x00, 0x00, // modification_time
        id >> 24 & 0xFF, id >> 16 & 0xFF, id >> 8 & 0xFF, id & 0xFF, // track_ID
        0x00, 0x00, 0x00, 0x00, // reserved
        duration >> 24, duration >> 16 & 0xFF, duration >> 8 & 0xFF, duration & 0xFF, // duration
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // reserved
        0x00, 0x00, // layer
        0x00, 0x00, // alternate_group
        volume >> 0 & 0xff, volume % 1 * 10 >> 0 & 0xff, // track volume // FIXME
        0x00, 0x00, // reserved
        0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
        width >> 8 & 0xFF, width & 0xFF, 0x00, 0x00, // width
        height >> 8 & 0xFF, height & 0xFF, 0x00, 0x00 // height
        ]));
      }
    }, {
      key: "traf",
      value: function traf(track, baseMediaDecodeTime) {
        var sampleDependencyTable = MP4.sdtp(track),
            id = track.id;
        return MP4.box(MP4.types.traf, MP4.box(MP4.types.tfhd, new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        id >> 24, id >> 16 & 0XFF, id >> 8 & 0XFF, id & 0xFF // track_ID
        ])), MP4.box(MP4.types.tfdt, new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        baseMediaDecodeTime >> 24, baseMediaDecodeTime >> 16 & 0XFF, baseMediaDecodeTime >> 8 & 0XFF, baseMediaDecodeTime & 0xFF // baseMediaDecodeTime
        ])), MP4.trun(track, sampleDependencyTable.length + 16 + // tfhd
        16 + // tfdt
        8 + // traf header
        16 + // mfhd
        8 + // moof header
        8), // mdat header
        sampleDependencyTable);
      }
      /**
       * Generate a track box.
       * @param track {object} a track definition
       * @return {Uint8Array} the track box
       */

    }, {
      key: "trak",
      value: function trak(track) {
        track.duration = track.duration || 0xffffffff;
        return MP4.box(MP4.types.trak, MP4.tkhd(track), MP4.mdia(track));
      }
    }, {
      key: "trex",
      value: function trex(track) {
        var id = track.id;
        return MP4.box(MP4.types.trex, new Uint8Array([0x00, // version 0
        0x00, 0x00, 0x00, // flags
        id >> 24, id >> 16 & 0XFF, id >> 8 & 0XFF, id & 0xFF, // track_ID
        0x00, 0x00, 0x00, 0x01, // default_sample_description_index
        0x00, 0x00, 0x00, 0x00, // default_sample_duration
        0x00, 0x00, 0x00, 0x00, // default_sample_size
        0x00, 0x01, 0x00, 0x01 // default_sample_flags
        ]));
      }
    }, {
      key: "trun",
      value: function trun(track, offset) {
        var samples = track.samples || [],
            len = samples.length,
            arraylen = 12 + 16 * len,
            array = new Uint8Array(arraylen),
            i,
            sample,
            duration,
            size,
            flags,
            cts;
        offset += 8 + arraylen;
        array.set([0x00, // version 0
        0x00, 0x0f, 0x01, // flags
        len >>> 24 & 0xFF, len >>> 16 & 0xFF, len >>> 8 & 0xFF, len & 0xFF, // sample_count
        offset >>> 24 & 0xFF, offset >>> 16 & 0xFF, offset >>> 8 & 0xFF, offset & 0xFF // data_offset
        ], 0);

        for (i = 0; i < len; i++) {
          sample = samples[i];
          duration = sample.duration;
          size = sample.size;
          flags = sample.flags;
          cts = sample.cts;
          array.set([duration >>> 24 & 0xFF, duration >>> 16 & 0xFF, duration >>> 8 & 0xFF, duration & 0xFF, // sample_duration
          size >>> 24 & 0xFF, size >>> 16 & 0xFF, size >>> 8 & 0xFF, size & 0xFF, // sample_size
          flags.isLeading << 2 | flags.dependsOn, flags.isDependedOn << 6 | flags.hasRedundancy << 4 | flags.paddingValue << 1 | flags.isNonSync, flags.degradPrio & 0xF0 << 8, flags.degradPrio & 0x0F, // sample_flags
          cts >>> 24 & 0xFF, cts >>> 16 & 0xFF, cts >>> 8 & 0xFF, cts & 0xFF // sample_composition_time_offset
          ], 12 + 16 * i);
        }

        return MP4.box(MP4.types.trun, array);
      }
    }, {
      key: "initSegment",
      value: function initSegment(tracks, duration, timescale) {
        if (!MP4.types) {
          MP4.init();
        }

        var movie = MP4.moov(tracks, duration, timescale),
            result;
        result = new Uint8Array(MP4.FTYP.byteLength + movie.byteLength);
        result.set(MP4.FTYP);
        result.set(movie, MP4.FTYP.byteLength);
        return result;
      }
    }]);

    return MP4;
  }();

  var track_id = 1;
  var BaseRemuxer = /*#__PURE__*/function () {
    function BaseRemuxer() {
      _classCallCheck(this, BaseRemuxer);
    }

    _createClass(BaseRemuxer, [{
      key: "flush",
      value: function flush() {
        this.mp4track.len = 0;
        this.mp4track.samples = [];
      }
    }, {
      key: "isReady",
      value: function isReady() {
        if (!this.readyToDecode || !this.samples.length) return null;
        return true;
      }
    }], [{
      key: "getTrackID",
      value: function getTrackID() {
        return track_id++;
      }
    }]);

    return BaseRemuxer;
  }();

  var AACRemuxer = /*#__PURE__*/function (_BaseRemuxer) {
    _inherits(AACRemuxer, _BaseRemuxer);

    var _super = _createSuper(AACRemuxer);

    function AACRemuxer(timescale) {
      var _this;

      _classCallCheck(this, AACRemuxer);

      _this = _super.call(this);
      _this.readyToDecode = false;
      _this.nextDts = 0;
      _this.dts = 0;
      _this.mp4track = {
        id: BaseRemuxer.getTrackID(),
        type: 'audio',
        channelCount: 0,
        len: 0,
        fragmented: true,
        timescale: timescale,
        duration: timescale,
        samples: [],
        config: '',
        codec: ''
      };
      _this.samples = [];
      _this.aac = new AACParser(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(AACRemuxer, [{
      key: "resetTrack",
      value: function resetTrack() {
        this.readyToDecode = false;
        this.mp4track.codec = '';
        this.mp4track.channelCount = '';
        this.mp4track.config = '';
        this.mp4track.timescale = this.timescale;
        this.nextDts = 0;
        this.dts = 0;
      }
    }, {
      key: "remux",
      value: function remux(frames) {
        if (frames.length > 0) {
          for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            var payload = frame.units;
            var size = payload.byteLength;
            this.samples.push({
              units: payload,
              size: size,
              duration: frame.duration
            });
            this.mp4track.len += size;

            if (!this.readyToDecode) {
              this.aac.setAACConfig();
            }
          }
        }
      }
    }, {
      key: "getPayload",
      value: function getPayload() {
        if (!this.isReady()) {
          return null;
        }

        var payload = new Uint8Array(this.mp4track.len);
        var offset = 0;
        var samples = this.mp4track.samples;
        var mp4Sample, duration;
        this.dts = this.nextDts;

        while (this.samples.length) {
          var sample = this.samples.shift();
              sample.units;
          duration = sample.duration;

          if (duration <= 0) {
            log("remuxer: invalid sample duration at DTS: ".concat(this.nextDts, " :").concat(duration));
            this.mp4track.len -= sample.size;
            continue;
          }

          this.nextDts += duration;
          mp4Sample = {
            size: sample.size,
            duration: duration,
            cts: 0,
            flags: {
              isLeading: 0,
              isDependedOn: 0,
              hasRedundancy: 0,
              degradPrio: 0,
              dependsOn: 1
            }
          };
          payload.set(sample.units, offset);
          offset += sample.size;
          samples.push(mp4Sample);
        }

        if (!samples.length) return null;
        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
      }
    }, {
      key: "getAacParser",
      value: function getAacParser() {
        return this.aac;
      }
    }]);

    return AACRemuxer;
  }(BaseRemuxer);

  var H264Remuxer = /*#__PURE__*/function (_BaseRemuxer) {
    _inherits(H264Remuxer, _BaseRemuxer);

    var _super = _createSuper(H264Remuxer);

    function H264Remuxer(timescale) {
      var _this;

      _classCallCheck(this, H264Remuxer);

      _this = _super.call(this);
      _this.readyToDecode = false;
      _this.nextDts = 0;
      _this.dts = 0;
      _this.mp4track = {
        id: BaseRemuxer.getTrackID(),
        type: 'video',
        len: 0,
        fragmented: true,
        sps: '',
        pps: '',
        fps: 30,
        width: 0,
        height: 0,
        timescale: timescale,
        duration: timescale,
        samples: []
      };
      _this.samples = [];
      _this.h264 = new H264Parser(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(H264Remuxer, [{
      key: "resetTrack",
      value: function resetTrack() {
        this.readyToDecode = false;
        this.mp4track.sps = '';
        this.mp4track.pps = '';
        this.nextDts = 0;
        this.dts = 0;
      }
    }, {
      key: "remux",
      value: function remux(frames) {
        var _iterator = _createForOfIteratorHelper(frames),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var frame = _step.value;
            var units = [];
            var size = 0;

            var _iterator2 = _createForOfIteratorHelper(frame.units),
                _step2;

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var unit = _step2.value;

                if (this.h264.parseNAL(unit)) {
                  units.push(unit);
                  size += unit.getSize();
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            if (units.length > 0 && this.readyToDecode) {
              this.mp4track.len += size;
              this.samples.push({
                units: units,
                size: size,
                keyFrame: frame.keyFrame,
                duration: frame.duration,
                compositionTimeOffset: frame.compositionTimeOffset
              });
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }, {
      key: "getPayload",
      value: function getPayload() {
        if (!this.isReady()) {
          return null;
        }

        var payload = new Uint8Array(this.mp4track.len);
        var offset = 0;
        var samples = this.mp4track.samples;
        var mp4Sample, duration;
        this.dts = this.nextDts;

        while (this.samples.length) {
          var sample = this.samples.shift(),
              units = sample.units;
          duration = sample.duration;

          if (duration <= 0) {
            log("remuxer: invalid sample duration at DTS: ".concat(this.nextDts, " :").concat(duration));
            this.mp4track.len -= sample.size;
            continue;
          }

          this.nextDts += duration;
          mp4Sample = {
            size: sample.size,
            duration: duration,
            cts: sample.compositionTimeOffset || 0,
            flags: {
              isLeading: 0,
              isDependedOn: 0,
              hasRedundancy: 0,
              degradPrio: 0,
              isNonSync: sample.keyFrame ? 0 : 1,
              dependsOn: sample.keyFrame ? 2 : 1
            }
          };

          var _iterator3 = _createForOfIteratorHelper(units),
              _step3;

          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var unit = _step3.value;
              payload.set(unit.getData(), offset);
              offset += unit.getSize();
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }

          samples.push(mp4Sample);
        }

        if (!samples.length) return null;
        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
      }
    }]);

    return H264Remuxer;
  }(BaseRemuxer);

  var RemuxController = /*#__PURE__*/function (_Event) {
    _inherits(RemuxController, _Event);

    var _super = _createSuper(RemuxController);

    function RemuxController(env) {
      var _this;

      _classCallCheck(this, RemuxController);

      _this = _super.call(this, 'remuxer');
      _this.initialized = false;
      _this.trackTypes = [];
      _this.tracks = {};
      _this.seq = 1;
      _this.env = env;
      _this.timescale = 1000;
      _this.mediaDuration = 0;
      _this.aacParser = null;
      return _this;
    }

    _createClass(RemuxController, [{
      key: "addTrack",
      value: function addTrack(type) {
        if (type === 'video' || type === 'both') {
          this.tracks.video = new H264Remuxer(this.timescale);
          this.trackTypes.push('video');
        }

        if (type === 'audio' || type === 'both') {
          var aacRemuxer = new AACRemuxer(this.timescale);
          this.aacParser = aacRemuxer.getAacParser();
          this.tracks.audio = aacRemuxer;
          this.trackTypes.push('audio');
        }
      }
    }, {
      key: "reset",
      value: function reset() {
        var _iterator = _createForOfIteratorHelper(this.trackTypes),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var type = _step.value;
            this.tracks[type].resetTrack();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        this.initialized = false;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.tracks = {};
        this.offAll();
      }
    }, {
      key: "flush",
      value: function flush() {
        if (!this.initialized) {
          if (this.isReady()) {
            this.dispatch('ready');
            this.initSegment();
            this.initialized = true;
            this.flush();
          }
        } else {
          var _iterator2 = _createForOfIteratorHelper(this.trackTypes),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var type = _step2.value;
              var track = this.tracks[type];
              var pay = track.getPayload();

              if (pay && pay.byteLength) {
                var moof = MP4.moof(this.seq, track.dts, track.mp4track);
                var mdat = MP4.mdat(pay);
                var payload = appendByteArray(moof, mdat);
                var data = {
                  type: type,
                  payload: payload,
                  dts: track.dts
                };

                if (type === 'video') {
                  data.fps = track.mp4track.fps;
                }

                this.dispatch('buffer', data);
                var duration = secToTime(track.dts / this.timescale);
                log("put segment (".concat(type, "): dts: ").concat(track.dts, " frames: ").concat(track.mp4track.samples.length, " second: ").concat(duration));
                track.flush();
                this.seq++;
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      }
    }, {
      key: "initSegment",
      value: function initSegment() {
        var tracks = [];

        var _iterator3 = _createForOfIteratorHelper(this.trackTypes),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var type = _step3.value;
            var track = this.tracks[type];

            if (this.env == 'browser') {
              var _data = {
                type: type,
                payload: MP4.initSegment([track.mp4track], this.mediaDuration, this.timescale)
              };
              this.dispatch('buffer', _data);
            } else {
              tracks.push(track.mp4track);
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }

        if (this.env == 'node') {
          var data = {
            type: 'all',
            payload: MP4.initSegment(tracks, this.mediaDuration, this.timescale)
          };
          this.dispatch('buffer', data);
        }

        log('Initial segment generated.');
      }
    }, {
      key: "isReady",
      value: function isReady() {
        var _iterator4 = _createForOfIteratorHelper(this.trackTypes),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var type = _step4.value;
            if (!this.tracks[type].readyToDecode || !this.tracks[type].samples.length) return false;
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }

        return true;
      }
    }, {
      key: "remux",
      value: function remux(data) {
        var _iterator5 = _createForOfIteratorHelper(this.trackTypes),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var type = _step5.value;
            var frames = data[type];
            if (type === 'audio' && this.tracks.video && !this.tracks.video.readyToDecode) continue;
            /* if video is present, don't add audio until video get ready */

            if (frames.length > 0) {
              this.tracks[type].remux(frames);
            }
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }

        this.flush();
      }
    }]);

    return RemuxController;
  }(Event);

  var BufferController = /*#__PURE__*/function (_Event) {
    _inherits(BufferController, _Event);

    var _super = _createSuper(BufferController);

    function BufferController(sourceBuffer, type) {
      var _this;

      _classCallCheck(this, BufferController);

      _this = _super.call(this, 'buffer');
      _this.type = type;
      _this.queue = new Uint8Array();
      _this.cleaning = false;
      _this.pendingCleaning = 0;
      _this.cleanOffset = 30;
      _this.cleanRanges = [];
      _this.sourceBuffer = sourceBuffer;

      _this.sourceBuffer.addEventListener('updateend', function () {
        if (_this.pendingCleaning > 0) {
          _this.initCleanup(_this.pendingCleaning);

          _this.pendingCleaning = 0;
        }

        _this.cleaning = false;

        if (_this.cleanRanges.length) {
          _this.doCleanup();

          return;
        }
      });

      _this.sourceBuffer.addEventListener('error', function () {
        _this.dispatch('error', {
          type: _this.type,
          name: 'buffer',
          error: 'buffer error'
        });
      });

      return _this;
    }

    _createClass(BufferController, [{
      key: "destroy",
      value: function destroy() {
        this.queue = null;
        this.sourceBuffer = null;
        this.offAll();
      }
    }, {
      key: "doCleanup",
      value: function doCleanup() {
        if (!this.cleanRanges.length) {
          this.cleaning = false;
          return;
        }

        var range = this.cleanRanges.shift();
        log("".concat(this.type, " remove range [").concat(range[0], " - ").concat(range[1], ")"));
        this.cleaning = true;
        this.sourceBuffer.remove(range[0], range[1]);
      }
    }, {
      key: "initCleanup",
      value: function initCleanup(cleanMaxLimit) {
        try {
          if (this.sourceBuffer.updating) {
            this.pendingCleaning = cleanMaxLimit;
            return;
          }

          if (this.sourceBuffer.buffered && this.sourceBuffer.buffered.length && !this.cleaning) {
            for (var i = 0; i < this.sourceBuffer.buffered.length; ++i) {
              var start = this.sourceBuffer.buffered.start(i);
              var end = this.sourceBuffer.buffered.end(i);

              if (cleanMaxLimit - start > this.cleanOffset) {
                end = cleanMaxLimit - this.cleanOffset;

                if (start < end) {
                  this.cleanRanges.push([start, end]);
                }
              }
            }

            this.doCleanup();
          }
        } catch (e) {
          error("Error occured while cleaning ".concat(this.type, " buffer - ").concat(e.name, ": ").concat(e.message));
        }
      }
    }, {
      key: "doAppend",
      value: function doAppend() {
        if (!this.queue.length) return;
        if (!this.sourceBuffer || this.sourceBuffer.updating) return;

        try {
          this.sourceBuffer.appendBuffer(this.queue);
          this.queue = new Uint8Array();
        } catch (e) {
          var name = 'unexpectedError';

          if (e.name === 'QuotaExceededError') {
            log("".concat(this.type, " buffer quota full"));
            name = 'QuotaExceeded';
          } else {
            error("Error occured while appending ".concat(this.type, " buffer - ").concat(e.name, ": ").concat(e.message));
            name = 'InvalidStateError';
          }

          this.dispatch('error', {
            type: this.type,
            name: name,
            error: 'buffer error'
          });
        }
      }
    }, {
      key: "feed",
      value: function feed(data) {
        this.queue = appendByteArray(this.queue, data);
      }
    }]);

    return BufferController;
  }(Event);

  var JMuxer = /*#__PURE__*/function (_Event) {
    _inherits(JMuxer, _Event);

    var _super = _createSuper(JMuxer);

    function JMuxer(options) {
      var _this;

      _classCallCheck(this, JMuxer);

      _this = _super.call(this, 'jmuxer');
      _this.isReset = false;
      var defaults = {
        node: '',
        mode: 'both',
        // both, audio, video
        flushingTime: 500,
        maxDelay: 500,
        clearBuffer: true,
        fps: 30,
        readFpsFromTrack: false,
        // set true to fetch fps value from NALu
        debug: false,
        onReady: function onReady() {},
        // function called when MSE is ready to accept frames
        onError: function onError() {} // function called when jmuxer encounters any buffer related error

      };
      _this.options = Object.assign({}, defaults, options);
      _this.env = (typeof process === "undefined" ? "undefined" : _typeof(process)) === 'object' && typeof window === 'undefined' ? 'node' : 'browser';

      if (_this.options.debug) {
        setLogger();
      }

      if (!_this.options.fps) {
        _this.options.fps = 30;
      }

      _this.frameDuration = 1000 / _this.options.fps | 0;
      _this.remuxController = new RemuxController(_this.env);

      _this.remuxController.addTrack(_this.options.mode);

      _this.initData();
      /* events callback */


      _this.remuxController.on('buffer', _this.onBuffer.bind(_assertThisInitialized(_this)));

      if (_this.env == 'browser') {
        _this.remuxController.on('ready', _this.createBuffer.bind(_assertThisInitialized(_this)));

        _this.initBrowser();
      }

      return _this;
    }

    _createClass(JMuxer, [{
      key: "initData",
      value: function initData() {
        this.lastCleaningTime = Date.now();
        this.kfPosition = [];
        this.kfCounter = 0;
        this.pendingUnits = {};
        this.remainingData = new Uint8Array();
        this.startInterval();
      }
    }, {
      key: "initBrowser",
      value: function initBrowser() {
        if (typeof this.options.node === 'string' && this.options.node == '') {
          error('no video element were found to render, provide a valid video element');
        }

        this.node = typeof this.options.node === 'string' ? document.getElementById(this.options.node) : this.options.node;
        this.mseReady = false;
        this.setupMSE();
      }
    }, {
      key: "createStream",
      value: function createStream() {
        var feed = this.feed.bind(this);
        var destroy = this.destroy.bind(this);
        this.stream = new stream.Duplex({
          writableObjectMode: true,
          read: function read(size) {},
          write: function write(data, encoding, callback) {
            feed(data);
            callback();
          },
          "final": function final(callback) {
            destroy();
            callback();
          }
        });
        return this.stream;
      }
    }, {
      key: "setupMSE",
      value: function setupMSE() {
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
    }, {
      key: "endMSE",
      value: function endMSE() {
        if (!this.mseEnded) {
          try {
            this.mseEnded = true;
            this.mediaSource.endOfStream();
          } catch (e) {
            error('mediasource is not available to end');
          }
        }
      }
    }, {
      key: "feed",
      value: function feed(data) {
        var remux = false,
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

          var _H264Parser$extractNA = H264Parser.extractNALu(data.video);

          var _H264Parser$extractNA2 = _slicedToArray(_H264Parser$extractNA, 2);

          slices = _H264Parser$extractNA2[0];
          left = _H264Parser$extractNA2[1];
          this.remainingData = left || new Uint8Array();

          if (slices.length > 0) {
            chunks.video = this.getVideoFrames(slices, duration, data.compositionTimeOffset);
            remux = true;
          } else {
            error('Failed to extract any NAL units from video data:', left);
            return;
          }
        }

        if (data.audio) {
          slices = this.remuxController.aacParser.extractAAC(data.audio);

          if (slices.length > 0) {
            chunks.audio = this.getAudioFrames(slices, duration);
            remux = true;
          } else {
            error('Failed to extract audio data from:', data.audio);
            return;
          }
        }

        if (!remux) {
          error('Input object must have video and/or audio property. Make sure it is a valid typed array');
          return;
        }

        this.remuxController.remux(chunks);
      }
    }, {
      key: "getVideoFrames",
      value: function getVideoFrames(nalus, duration, compositionTimeOffset) {
        var _this2 = this;

        var units = [],
            frames = [],
            fd = 0,
            tt = 0,
            keyFrame = false,
            vcl = false;

        if (this.pendingUnits.units) {
          units = this.pendingUnits.units;
          vcl = this.pendingUnits.vcl;
          keyFrame = this.pendingUnits.keyFrame;
          this.pendingUnits = {};
        }

        var _iterator = _createForOfIteratorHelper(nalus),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var nalu = _step.value;
            var unit = new NALU(nalu);

            if (unit.type() === NALU.IDR || unit.type() === NALU.NDR) {
              H264Parser.parseHeader(unit);
            }

            if (units.length && vcl && (unit.isfmb || !unit.isvcl)) {
              frames.push({
                units: units,
                keyFrame: keyFrame
              });
              units = [];
              keyFrame = false;
              vcl = false;
            }

            units.push(unit);
            keyFrame = keyFrame || unit.isKeyframe();
            vcl = vcl || unit.isvcl;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        if (units.length) {
          // lets keep indecisive nalus as pending in case of fixed fps
          if (!duration) {
            this.pendingUnits = {
              units: units,
              keyFrame: keyFrame,
              vcl: vcl
            };
          } else if (vcl) {
            frames.push({
              units: units,
              keyFrame: keyFrame
            });
          } else {
            var last = frames.length - 1;

            if (last >= 0) {
              frames[last].units = frames[last].units.concat(units);
            }
          }
        }

        fd = duration ? duration / frames.length | 0 : this.frameDuration;
        tt = duration ? duration - fd * frames.length : 0;
        frames.map(function (frame) {
          frame.duration = fd;
          frame.compositionTimeOffset = compositionTimeOffset;

          if (tt > 0) {
            frame.duration++;
            tt--;
          }

          _this2.kfCounter++;

          if (frame.keyFrame && _this2.options.clearBuffer) {
            _this2.kfPosition.push(_this2.kfCounter * fd / 1000);
          }
        });
        log("jmuxer: No. of frames of the last chunk: ".concat(frames.length));
        return frames;
      }
    }, {
      key: "getAudioFrames",
      value: function getAudioFrames(aacFrames, duration) {
        var frames = [],
            fd = 0,
            tt = 0;

        var _iterator2 = _createForOfIteratorHelper(aacFrames),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var units = _step2.value;
            frames.push({
              units: units
            });
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        fd = duration ? duration / frames.length | 0 : this.frameDuration;
        tt = duration ? duration - fd * frames.length : 0;
        frames.map(function (frame) {
          frame.duration = fd;

          if (tt > 0) {
            frame.duration++;
            tt--;
          }
        });
        return frames;
      }
    }, {
      key: "destroy",
      value: function destroy() {
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
          for (var type in this.bufferControllers) {
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
    }, {
      key: "reset",
      value: function reset() {
        this.stopInterval();
        this.isReset = true;
        this.node.pause();

        if (this.remuxController) {
          this.remuxController.reset();
        }

        if (this.bufferControllers) {
          for (var type in this.bufferControllers) {
            this.bufferControllers[type].destroy();
          }

          this.bufferControllers = null;
          this.endMSE();
        }

        this.initData();

        if (this.env == 'browser') {
          this.initBrowser();
        }

        log('JMuxer was reset');
      }
    }, {
      key: "createBuffer",
      value: function createBuffer() {
        if (!this.mseReady || !this.remuxController || !this.remuxController.isReady() || this.bufferControllers) return;
        this.bufferControllers = {};

        for (var type in this.remuxController.tracks) {
          var track = this.remuxController.tracks[type];

          if (!JMuxer.isSupported("".concat(type, "/mp4; codecs=\"").concat(track.mp4track.codec, "\""))) {
            error('Browser does not support codec');
            return false;
          }

          var sb = this.mediaSource.addSourceBuffer("".concat(type, "/mp4; codecs=\"").concat(track.mp4track.codec, "\""));
          this.bufferControllers[type] = new BufferController(sb, type);
          this.bufferControllers[type].on('error', this.onBufferError.bind(this));
        }
      }
    }, {
      key: "startInterval",
      value: function startInterval() {
        var _this3 = this;

        this.interval = setInterval(function () {
          if (_this3.options.flushingTime) {
            _this3.applyAndClearBuffer();
          } else if (_this3.bufferControllers) {
            _this3.cancelDelay();
          }
        }, this.options.flushingTime || 1000);
      }
    }, {
      key: "stopInterval",
      value: function stopInterval() {
        if (this.interval) {
          clearInterval(this.interval);
        }
      }
    }, {
      key: "cancelDelay",
      value: function cancelDelay() {
        if (this.node.buffered && this.node.buffered.length > 0 && !this.node.seeking) {
          var end = this.node.buffered.end(0);

          if (end - this.node.currentTime > this.options.maxDelay / 1000) {
            console.log('delay');
            this.node.currentTime = end - 0.001;
          }
        }
      }
    }, {
      key: "releaseBuffer",
      value: function releaseBuffer() {
        for (var type in this.bufferControllers) {
          this.bufferControllers[type].doAppend();
        }
      }
    }, {
      key: "applyAndClearBuffer",
      value: function applyAndClearBuffer() {
        if (this.bufferControllers) {
          this.releaseBuffer();
          this.clearBuffer();
        }
      }
    }, {
      key: "getSafeClearOffsetOfBuffer",
      value: function getSafeClearOffsetOfBuffer(offset) {
        var maxLimit = this.options.mode === 'audio' && offset || 0,
            adjacentOffset;

        for (var i = 0; i < this.kfPosition.length; i++) {
          if (this.kfPosition[i] >= offset) {
            break;
          }

          adjacentOffset = this.kfPosition[i];
        }

        if (adjacentOffset) {
          this.kfPosition = this.kfPosition.filter(function (kfDelimiter) {
            if (kfDelimiter < adjacentOffset) {
              maxLimit = kfDelimiter;
            }

            return kfDelimiter >= adjacentOffset;
          });
        }

        return maxLimit;
      }
    }, {
      key: "clearBuffer",
      value: function clearBuffer() {
        if (this.options.clearBuffer && Date.now() - this.lastCleaningTime > 10000) {
          for (var type in this.bufferControllers) {
            var cleanMaxLimit = this.getSafeClearOffsetOfBuffer(this.node.currentTime);
            this.bufferControllers[type].initCleanup(cleanMaxLimit);
          }

          this.lastCleaningTime = Date.now();
        }
      }
    }, {
      key: "onBuffer",
      value: function onBuffer(data) {
        if (this.options.readFpsFromTrack && typeof data.fps !== 'undefined' && this.options.fps != data.fps) {
          this.options.fps = data.fps;
          this.frameDuration = Math.ceil(1000 / data.fps);
          log("JMuxer changed FPS to ".concat(data.fps, " from track data"));
        }

        if (this.env == 'browser') {
          if (this.bufferControllers && this.bufferControllers[data.type]) {
            this.bufferControllers[data.type].feed(data.payload);
          }
        } else if (this.stream) {
          this.stream.push(data.payload);
        }

        if (this.options.flushingTime === 0) {
          this.applyAndClearBuffer();
        }
      }
      /* Events on MSE */

    }, {
      key: "onMSEOpen",
      value: function onMSEOpen() {
        this.mseReady = true;
        URL.revokeObjectURL(this.url); // this.createBuffer();

        if (typeof this.options.onReady === 'function') {
          this.options.onReady.call(null, this.isReset);
        }
      }
    }, {
      key: "onMSEClose",
      value: function onMSEClose() {
        this.mseReady = false;
        this.videoStarted = false;
      }
    }, {
      key: "onBufferError",
      value: function onBufferError(data) {
        if (data.name == 'QuotaExceeded') {
          log("JMuxer cleaning ".concat(data.type, " buffer due to QuotaExceeded error"));
          this.bufferControllers[data.type].initCleanup(this.node.currentTime);
          return;
        } else if (data.name == 'InvalidStateError') {
          log('JMuxer is reseting due to InvalidStateError');
          this.reset();
        } else {
          this.endMSE();
        }

        if (typeof this.options.onError === 'function') {
          this.options.onError.call(null, data);
        }
      }
    }], [{
      key: "isSupported",
      value: function isSupported(codec) {
        return window.MediaSource && window.MediaSource.isTypeSupported(codec);
      }
    }]);

    return JMuxer;
  }(Event);

  return JMuxer;

}));
