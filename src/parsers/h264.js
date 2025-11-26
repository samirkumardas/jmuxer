import { ExpGolomb } from '../util/exp-golomb.js';
import * as debug from '../util/debug';

// spec https://www.itu.int/rec/T-REC-H.264/

export class H264Parser {

    static extractNALu(buffer) {
        let i = 0,
            length = buffer.byteLength,
            result = [],
            lastIndex = 0,
            zeroCount = 0;

        while (i < length) {
            let value = buffer[i++];

            if (value === 0) {
                zeroCount++;
            } else if (value === 1 && zeroCount >= 2) {
                let startCodeLength = zeroCount + 1;

                if (lastIndex !== i - startCodeLength) {
                    result.push(buffer.subarray(lastIndex, i - startCodeLength));
                }

                lastIndex = i;
                zeroCount = 0;
            } else {
                zeroCount = 0;
            }
        }

        // Remaining data after last start code
        let left = null;
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
    static skipScalingList(decoder, count) {
        let lastScale = 8,
            nextScale = 8,
            deltaScale;
        for (let j = 0; j < count; j++) {
            if (nextScale !== 0) {
                deltaScale = decoder.readEG();
                nextScale = (lastScale + deltaScale + 256) % 256;
            }
            lastScale = (nextScale === 0) ? lastScale : nextScale;
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
    static readSPS(data) {
        let decoder = new ExpGolomb(data);
        let frameCropLeftOffset = 0,
            frameCropRightOffset = 0,
            frameCropTopOffset = 0,
            frameCropBottomOffset = 0,
            sarScale = 1,
            profileIdc,
            profileCompat,
            levelIdc,
            numRefFramesInPicOrderCntCycle,
            picWidthInMbsMinus1,
            picHeightInMapUnitsMinus1,
            frameMbsOnlyFlag,
            scalingListCount,
            fps = 0;
        decoder.readUByte(); // skip NAL header

        // rewrite NAL
        let rbsp = [],
            hdr_bytes = 1,
            nal_bytes = data.byteLength;
        for (let i = hdr_bytes; i < nal_bytes; i ++) {
            if ((i + 2) < nal_bytes && decoder.readBits(24, false) === 0x000003) {
                rbsp.push(decoder.readBits(8));
                rbsp.push(decoder.readBits(8));
                i += 2;

                // emulation_prevention_three_byte
                decoder.readBits(8);
            }
            else {
                rbsp.push(decoder.readBits(8));
            }
        }
        decoder.setData(new Uint8Array(rbsp));
        // end of rewrite data

        profileIdc = decoder.readUByte(); // profile_idc
        profileCompat = decoder.readBits(5); // constraint_set[0-4]_flag, u(5)
        decoder.skipBits(3); // reserved_zero_3bits u(3),
        levelIdc = decoder.readUByte(); // level_idc u(8)
        decoder.skipUEG(); // seq_parameter_set_id
        // some profiles have more optional data we don't need
        if (profileIdc === 100 ||
            profileIdc === 110 ||
            profileIdc === 122 ||
            profileIdc === 244 ||
            profileIdc === 44 ||
            profileIdc === 83 ||
            profileIdc === 86 ||
            profileIdc === 118 ||
            profileIdc === 128) {
            var chromaFormatIdc = decoder.readUEG();
            if (chromaFormatIdc === 3) {
                decoder.skipBits(1); // separate_colour_plane_flag
            }
            decoder.skipUEG(); // bit_depth_luma_minus8
            decoder.skipUEG(); // bit_depth_chroma_minus8
            decoder.skipBits(1); // qpprime_y_zero_transform_bypass_flag
            if (decoder.readBoolean()) { // seq_scaling_matrix_present_flag
                scalingListCount = (chromaFormatIdc !== 3) ? 8 : 12;
                for (let i = 0; i < scalingListCount; ++i) {
                    if (decoder.readBoolean()) { // seq_scaling_list_present_flag[ i ]
                        if (i < 6) {
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
            for (let i = 0; i < numRefFramesInPicOrderCntCycle; ++i) {
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
        if (decoder.readBoolean()) { // frame_cropping_flag
            frameCropLeftOffset = decoder.readUEG();
            frameCropRightOffset = decoder.readUEG();
            frameCropTopOffset = decoder.readUEG();
            frameCropBottomOffset = decoder.readUEG();
        }
        if (decoder.readBoolean()) {
            // vui_parameters_present_flag
            if (decoder.readBoolean()) {
                // aspect_ratio_info_present_flag
                let sarRatio;
                const aspectRatioIdc = decoder.readUByte();
                switch (aspectRatioIdc) {
                    case 1: sarRatio = [1, 1]; break;
                    case 2: sarRatio = [12, 11]; break;
                    case 3: sarRatio = [10, 11]; break;
                    case 4: sarRatio = [16, 11]; break;
                    case 5: sarRatio = [40, 33]; break;
                    case 6: sarRatio = [24, 11]; break;
                    case 7: sarRatio = [20, 11]; break;
                    case 8: sarRatio = [32, 11]; break;
                    case 9: sarRatio = [80, 33]; break;
                    case 10: sarRatio = [18, 11]; break;
                    case 11: sarRatio = [15, 11]; break;
                    case 12: sarRatio = [64, 33]; break;
                    case 13: sarRatio = [160, 99]; break;
                    case 14: sarRatio = [4, 3]; break;
                    case 15: sarRatio = [3, 2]; break;
                    case 16: sarRatio = [2, 1]; break;
                    case 255: {
                        sarRatio = [decoder.readUByte() << 8 | decoder.readUByte(), decoder.readUByte() << 8 | decoder.readUByte()];
                        break;
                    }
                }
                if (sarRatio && sarRatio[0] > 0 && sarRatio[1] > 0) {
                    sarScale = sarRatio[0] / sarRatio[1];
                }
            }
            if (decoder.readBoolean()) { decoder.skipBits(1); }

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
                let unitsInTick = decoder.readUInt();
                let timeScale = decoder.readUInt();
                let fixedFrameRate = decoder.readBoolean();
                let frameDuration = timeScale / (2 * unitsInTick);

                // if (fixedFrameRate) {
                //     fps = frameDuration;
                // }
                // Return the fps value even if fixedFrameRate is not set
                fps = frameDuration;
            }
        }
        return {
            fps: fps > 0 ? fps : undefined,
            width: Math.ceil((((picWidthInMbsMinus1 + 1) * 16) - frameCropLeftOffset * 2 - frameCropRightOffset * 2) * sarScale),
            height: ((2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16) - ((frameMbsOnlyFlag ? 2 : 4) * (frameCropTopOffset + frameCropBottomOffset)),
        };
    }
    
}

export class NALU264 {
    static get NDR() { return 1; }
    static get IDR() { return 5; }
    static get SEI() { return 6; }
    static get SPS() { return 7; }
    static get PPS() { return 8; }
    static get AUD() { return 9; }

    static get TYPES() {
        return {
            [NALU264.IDR]: 'IDR',
            [NALU264.SEI]: 'SEI',
            [NALU264.SPS]: 'SPS',
            [NALU264.PPS]: 'PPS',
            [NALU264.NDR]: 'NDR',
            [NALU264.AUD]: 'AUD',
        };
    }

    constructor(data) {
        this.payload = data;
        this.nri = (this.payload[0] & 0x60) >> 5; // nal_ref_idc
        this.nalUnitType = this.payload[0] & 0x1f;
        this._sliceType = null;
        this._isFirstSlice = false;
    }

    toString() {
        return `${NALU264.TYPES[this.type()] || 'UNKNOWN'}: NRI: ${this.getNri()}`;
    }

    getNri() {
        return this.nri;
    }

    type() {
        return this.nalUnitType;
    }

    get isKeyframe() {
        return this.nalUnitType === NALU264.IDR;
    }

    get isVCL() {
        return this.nalUnitType == NALU264.IDR || this.nalUnitType == NALU264.NDR;
    }

    parseHeader() {
        let decoder = new ExpGolomb(this.getPayload());
        // skip NALu type
        decoder.readUByte();
        this._isFirstSlice = decoder.readUEG() === 0;
        this._sliceType = decoder.readUEG();
    }

    get isFirstSlice() {
        if (!this._isFirstSlice) {
            this.parseHeader();
        }
        return this._isFirstSlice;
    }

    get sliceType() {
        if (!this._sliceType) {
            this.parseHeader();
        }
        return this._sliceType;
    }
    
    getPayload() {
        return this.payload;
    }

    getPayloadSize() {
        return this.payload.byteLength;
    }

    getSize() {
        return 4 + this.getPayloadSize();
    }

    getData() {
        const result = new Uint8Array(this.getSize());
        const view = new DataView(result.buffer);
        view.setUint32(0, this.getSize() - 4);
        result.set(this.getPayload(), 4);
        return result;
    }
}
