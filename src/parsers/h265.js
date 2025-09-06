import { ExpGolomb } from '../util/exp-golomb.js';
import * as debug from '../util/debug';

// spec https://www.itu.int/rec/T-REC-H.265/

export class H265Parser {

    static extractNALu(buffer) {
        let i = 0,
            length = buffer.byteLength,
            value,
            state = 0,
            result = [],
            left,
            lastIndex = 0;

        while (i < length) {
            value = buffer[i++];
            // finding 3 or 4-byte start codes (00 00 01 OR 00 00 00 01)
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
                        if (lastIndex != i - state -1) {
                            result.push(buffer.subarray(lastIndex, i - state -1));
                        }
                        lastIndex = i;
                        state = 0;
                    } else {
                        state = 0;
                    }
                    break;
                default:
                    break;
            }
        }

        if (lastIndex < length) {
            left = buffer.subarray(lastIndex, length);
        }
        return [result, left];
    }

    static removeEmulationPreventionBytes(nal) {
        const rbsp = [];
        let zeroCount = 0;

        for (let i = 0; i < nal.length; i++) {
            const value = nal[i];

            if (zeroCount === 2 && value === 0x03) {
                // Skip this emulation prevention byte
                zeroCount = 0;
                continue;
            }

            rbsp.push(value);

            if (value === 0x00) {
                zeroCount++;
            } else {
                zeroCount = 0;
            }
        }

        return new Uint8Array(rbsp);
    }


    /**
     * Read a sequence parameter set and return some interesting video
     * properties. A sequence parameter set is the H265 metadata that
     * describes the properties of upcoming video frames.
     * @param data {Uint8Array} the bytes of a sequence parameter set
     * @return {object} an object with configuration parsed from the
     * sequence parameter set, including the dimensions of the
     * associated video frames.
     */
    static readSPS(data) {
        let decoder = new ExpGolomb(data);

        // Skip NALU header (2 bytes for HEVC)
        decoder.readUByte();
        decoder.readUByte();

        decoder.readBits(4); // sps_video_parameter_set_id
        decoder.readBits(3); // sps_max_sub_layers_minus1
        decoder.readBits(1); // sps_temporal_id_nesting_flag

        // --- profile_tier_level() ---
        let profile_space = decoder.readBits(2);
        let tier_flag = decoder.readBits(1);
        let profile_idc = decoder.readBits(5);

        let profile_compatibility_flags = decoder.readUInt(); // 32 bits
        let constraint_indicator_flags_high = decoder.readUInt(); // 32 bits
        let constraint_indicator_flags_low = decoder.readUShort(); // 16 bits
        let constraint_indicator_flags = 
            (BigInt(constraint_indicator_flags_high) << 16n) | BigInt(constraint_indicator_flags_low);

        let level_idc = decoder.readUByte();

        decoder.readUEG(); // seq_parameter_set_id

        let chroma_format_idc = decoder.readUEG();
        if (chroma_format_idc === 3) {
            decoder.readBits(1); // separate_colour_plane_flag
        }

        let pic_width_in_luma_samples = decoder.readUEG();
        let pic_height_in_luma_samples = decoder.readUEG();

        // Cropping
        let conformance_window_flag = decoder.readBoolean();
        let conf_win_left_offset = 0, conf_win_right_offset = 0, conf_win_top_offset = 0, conf_win_bottom_offset = 0;
        if (conformance_window_flag) {
            conf_win_left_offset = decoder.readUEG();
            conf_win_right_offset = decoder.readUEG();
            conf_win_top_offset = decoder.readUEG();
            conf_win_bottom_offset = decoder.readUEG();
        }

        let fps = null;
        let vui_parameters_present_flag = decoder.readBoolean();
        if (vui_parameters_present_flag) {
            let aspect_ratio_info_present_flag = decoder.readBoolean();
            if (aspect_ratio_info_present_flag) {
                let aspect_ratio_idc = decoder.readUByte();
                if (aspect_ratio_idc === 255) { // Extended_SAR
                    decoder.readUShort(); // sar_width
                    decoder.readUShort(); // sar_height
                }
            }
            let overscan_info_present_flag = decoder.readBoolean();
            if (overscan_info_present_flag) {
                decoder.readBoolean(); // overscan_appropriate_flag
            }
            let video_signal_type_present_flag = decoder.readBoolean();
            if (video_signal_type_present_flag) {
                decoder.readBits(3); // video_format
                decoder.readBoolean(); // video_full_range_flag
                let colour_description_present_flag = decoder.readBoolean();
                if (colour_description_present_flag) {
                    decoder.readUByte(); // colour_primaries
                    decoder.readUByte(); // transfer_characteristics
                    decoder.readUByte(); // matrix_coeffs
                }
            }
            let chroma_loc_info_present_flag = decoder.readBoolean();
            if (chroma_loc_info_present_flag) {
                decoder.readUEG(); // chroma_sample_loc_type_top_field
                decoder.readUEG(); // chroma_sample_loc_type_bottom_field
            }
            decoder.readBoolean(); // neutral_chroma_indication_flag
            decoder.readBoolean(); // field_seq_flag
            decoder.readBoolean(); // frame_field_info_present_flag

            // Timing info
            let timing_info_present_flag = decoder.readBoolean();
            if (timing_info_present_flag) {
                let num_units_in_tick = decoder.readUInt();
                let time_scale = decoder.readUInt();
                decoder.readBoolean(); // poc_proportional_to_timing_flag
                if (num_units_in_tick) {
                    fps = time_scale / (2 * num_units_in_tick);
                }
            }
        }

        // Final width/height
        let sub_width_c = (chroma_format_idc === 1 || chroma_format_idc === 2) ? 2 : 1;
        let sub_height_c = (chroma_format_idc === 1) ? 2 : 1;
        let width = pic_width_in_luma_samples - sub_width_c * (conf_win_right_offset + conf_win_left_offset);
        let height = pic_height_in_luma_samples - sub_height_c * (conf_win_top_offset + conf_win_bottom_offset);

        return {
            width,
            height,
            profile_space,
            tier_flag,
            profile_idc,
            profile_compatibility_flags,
            constraint_indicator_flags,
            level_idc,
            chroma_format_idc,
            fps,
        };
    }

}

export class NALU265 {
    static get IDR_W_RADL()  { return 19; }
    static get IDR_N_LP()    { return 20; }
    static get CRA()         { return 21; }
    static get VPS()         { return 32; }
    static get SPS()         { return 33; }
    static get PPS()         { return 34; }
    static get AUD()         { return 35; }
    static get SEI()         { return 39; }
    static get SEI2()        { return 40; }

    static get TYPES() {
        return {
            [NALU265.IDR_W_RADL]:  'IDR',
            [NALU265.IDR_N_LP]:    'IDR2',
            [NALU265.CRA]:         'CRA',
            [NALU265.VPS]:         'VPS',
            [NALU265.SPS]:         'SPS',
            [NALU265.PPS]:         'PPS',
            [NALU265.AUD]:         'AUD',
            [NALU265.SEI]:         'SEI',
            [NALU265.SEI2]:        'SEI2',
        };
    }

    constructor(data) {
        this.payload = data;
        this.nalUnitType = (data[0] & 0b01111110) >> 1;
        this.nuhLayerId = ((data[0] & 0b00000001) << 5) | ((data[1] & 0b11111000) >> 3);
        this.nuhTemporalIdPlus1 = data[1] & 0b00000111;
        this._isFirstSlice = null;
        this._sliceType = null;
    }

    toString() {
        return `${NALU265.TYPES[this] || 'UNKNOWN'}: Layer: ${this.nuhLayerId}, Temporal Id: ${this.nuhTemporalIdPlus1}`;
    }

    type() {
        return this.nalUnitType;
    }

    get isKeyframe() {
        return [
            NALU265.IDR_W_RADL,
            NALU265.IDR_N_LP,
            NALU265.CRA
        ].includes(this.nalUnitType);
    }

    get isVCL() {
        return this.nalUnitType <=31;
    }

    parseHeader() {
        let decoder = new ExpGolomb(this.getPayload());

        // first_slice_segment_in_pic_flag
        this._isFirstSlice = decoder.readBits(1) === 1;

        // if NALU is not IDR/CRA/other IRAP, next comes no_output_of_prior_pics_flag
        if (this.isKeyframe) {
            decoder.readBits(1); // no_output_of_prior_pics_flag
        }

        // slice_pic_parameter_set_id
        decoder.readUEG();

        // slice_type (only for some NALU types, but useful for debugging)
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
