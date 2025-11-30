import { ExpGolomb } from '../util/exp-golomb.js';
import * as debug from '../util/debug';

// spec https://www.itu.int/rec/T-REC-H.265/

export class H265Parser {

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
        const sps_max_sub_layers_minus1 = decoder.readBits(3); // sps_max_sub_layers_minus1
        decoder.readBits(1); // sps_temporal_id_nesting_flag

        // --- profile_tier_level() ---
        let profile_space = decoder.readBits(2);
        let tier_flag = decoder.readBits(1);
        let profile_idc = decoder.readBits(5);

        let profile_compatibility_flags = decoder.readUInt(); // 32 bits
        let constraint_indicator_flags = new Uint8Array(6);
        for (let i = 0; i < 6; i++) {
            constraint_indicator_flags[i] = decoder.readUByte();
        }

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

        const bit_depth_luma_minus8 = decoder.readUEG();
        const bit_depth_chroma_minus8 = decoder.readUEG();

        const log2_max_pic_order_cnt_lsb_minus4 = decoder.readUEG();

        const ordering_flag = decoder.readBits(1); // sps_sub_layer_ordering_info_present_flag

        for (let i = (ordering_flag ? 0 : sps_max_sub_layers_minus1); i <= sps_max_sub_layers_minus1; i++) {
            const max_dec = decoder.readUEG();
            const max_num = decoder.readUEG();
            const max_latency = decoder.readUEG();
        }

        decoder.readUEG(); // log2_min_luma_coding_block_size_minus3
        decoder.readUEG(); // log2_diff_max_min_luma_coding_block_size
        decoder.readUEG(); // log2_min_luma_transform_block_size_minus2
        decoder.readUEG(); // log2_diff_max_min_luma_transform_block_size
        decoder.readUEG(); // max_transform_hierarchy_depth_inter
        decoder.readUEG(); // max_transform_hierarchy_depth_intra

        const scaling_list_enabled_flag = decoder.readBits(1);
        if (scaling_list_enabled_flag) {
            const sps_scaling_list_data_present_flag = decoder.readBits(1);
            if (sps_scaling_list_data_present_flag) {
                // inline skipScalingListH265
                for (let sizeId = 0; sizeId < 4; sizeId++) {
                    for (let matrixId = 0; matrixId < (sizeId === 3 ? 2 : 6); matrixId++) {
                        const flag = decoder.readBits(1);
                        if (!flag) {
                            decoder.readUEG(); // scaling_list_pred_matrix_id_delta
                        } else {
                            const coefNum = Math.min(64, 1 << (4 + (sizeId << 1)));
                            if (sizeId > 1) decoder.readEG(); // scaling_list_dc_coef_minus8
                            for (let k = 0; k < coefNum; k++) decoder.readEG();
                        }
                    }
                }
            }
        }

        const amp_enabled_flag = decoder.readBits(1);
        const sample_adaptive_offset_enabled_flag = decoder.readBits(1);

        const pcm_enabled_flag = decoder.readBits(1);
        if (pcm_enabled_flag) {
            decoder.readBits(4); // pcm_sample_bit_depth_luma_minus1
            decoder.readBits(4); // pcm_sample_bit_depth_chroma_minus1
            decoder.readUEG(); // log2_min_pcm_luma_coding_block_size_minus3
            decoder.readUEG(); // log2_diff_max_min_pcm_luma_coding_block_size
            decoder.readBits(1); // pcm_loop_filter_disabled_flag
        }

        const num_short_term_ref_pic_sets = decoder.readUEG();
        // inline simplified short-term RPS parsing
        for (let stIdx = 0; stIdx < num_short_term_ref_pic_sets; stIdx++) {
            let inter_ref_pic_set_prediction_flag = false;
            if (stIdx !== 0) {
                inter_ref_pic_set_prediction_flag = decoder.readBoolean();
            }
            if (inter_ref_pic_set_prediction_flag) {
                decoder.readUEG(); // delta_idx_minus1 or related
                decoder.readBits(1); // delta_rps_sign
                decoder.readUEG(); // abs_delta_rps_minus1
                // fine-grained details omitted for brevity
            } else {
                const num_negative_pics = decoder.readUEG();
                const num_positive_pics = decoder.readUEG();
                for (let i = 0; i < num_negative_pics; i++) {
                    decoder.readUEG(); // delta_poc_s0_minus1[i]
                    decoder.readBits(1); // used_by_curr_pic_s0_flag[i]
                }
                for (let i = 0; i < num_positive_pics; i++) {
                    decoder.readUEG(); // delta_poc_s1_minus1[i]
                    decoder.readBits(1); // used_by_curr_pic_s1_flag[i]
                }
            }
        }

        const long_term_ref_pics_present_flag = decoder.readBits(1);
        if (long_term_ref_pics_present_flag) {
            const num_long_term_ref_pics_sps = decoder.readUEG();
            for (let i = 0; i < num_long_term_ref_pics_sps; i++) {
                decoder.readUEG(); // lt_ref_pic_poc_lsb_sps[i]
                decoder.readBits(1); // used_by_curr_pic_lt_sps_flag[i]
            }
        }

        const sps_temporal_mvp_enabled_flag = decoder.readBits(1);
        const strong_intra_smoothing_enabled_flag = decoder.readBits(1);

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

            let default_display_window_flag = decoder.readBoolean();
            if (default_display_window_flag) {
                decoder.readUEG(); // def_disp_win_left_offset
                decoder.readUEG(); // def_disp_win_right_offset
                decoder.readUEG(); // def_disp_win_top_offset
                decoder.readUEG(); // def_disp_win_bottom_offset
            }

            let vui_timing_info_present_flag = decoder.readBoolean();
            if (vui_timing_info_present_flag) {
                let vui_num_units_in_tick = decoder.readUInt();
                let vui_time_scale = decoder.readUInt();
                const vui_poc_proportional_to_timing_flag = decoder.readBoolean();
                if (vui_poc_proportional_to_timing_flag) {
                    decoder.readUEG(); // vui_num_ticks_poc_diff_one_minus1
                }

                const vui_hrd_parameters_present_flag = decoder.readBoolean();
                if (vui_hrd_parameters_present_flag) {
                    // inline simplified HRD parsing
                    const commonInfPresentFlag = true;
                    let nal_hrd_parameters_present_flag = false;
                    let vcl_hrd_parameters_present_flag = false;
                    let sub_pic_hrd_params_present_flag = false;

                    if (commonInfPresentFlag) {
                        nal_hrd_parameters_present_flag = decoder.readBoolean();
                        vcl_hrd_parameters_present_flag = decoder.readBoolean();
                        if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
                            sub_pic_hrd_params_present_flag = decoder.readBoolean();
                            if (sub_pic_hrd_params_present_flag) {
                                decoder.readBits(8); // tick_divisor_minus2
                                decoder.readBits(5); // du_cpb_removal_delay_increment_length_minus1
                                decoder.readBits(1); // sub_pic_cpb_params_in_pic_timing_sei_flag
                                decoder.readBits(5); // dpb_output_delay_du_length_minus1
                            }
                            decoder.readBits(4); // bit_rate_scale
                            decoder.readBits(4); // cpb_size_scale
                            if (sub_pic_hrd_params_present_flag) {
                                decoder.readBits(4); // cpb_size_du_scale
                            }
                            decoder.readBits(5); // initial_cpb_removal_delay_length_minus1
                            decoder.readBits(5); // au_cpb_removal_delay_length_minus1
                            decoder.readBits(5); // dpb_output_delay_length_minus1
                        }
                    }

                    for (let i = 0; i <= sps_max_sub_layers_minus1; i++) {
                        const fixed_pic_rate_general_flag = decoder.readBoolean();
                        let fixed_pic_rate_within_cvs_flag = false;
                        let low_delay_hrd_flag = false;
                        let cpb_cnt_minus1 = 0;
                        if (!fixed_pic_rate_general_flag) {
                            fixed_pic_rate_within_cvs_flag = decoder.readBoolean();
                        } else {
                            fixed_pic_rate_within_cvs_flag = true;
                        }
                        if (fixed_pic_rate_within_cvs_flag) {
                            decoder.readUEG(); // elemental_duration_in_tc_minus1
                        } else {
                            low_delay_hrd_flag = decoder.readBoolean();
                        }
                        if (!low_delay_hrd_flag) {
                            cpb_cnt_minus1 = decoder.readUEG();
                        }
                        if (nal_hrd_parameters_present_flag) {
                            for (let j = 0; j <= cpb_cnt_minus1; j++) {
                                decoder.readUEG(); // bit_rate_value_minus1
                                decoder.readUEG(); // cpb_size_value_minus1
                                if (sub_pic_hrd_params_present_flag) {
                                    decoder.readUEG(); // cpb_size_du_value_minus1
                                    decoder.readUEG(); // bit_rate_du_value_minus1
                                }
                                decoder.readBits(1); // cbr_flag
                            }
                        }
                        if (vcl_hrd_parameters_present_flag) {
                            for (let j = 0; j <= cpb_cnt_minus1; j++) {
                                decoder.readUEG(); // bit_rate_value_minus1
                                decoder.readUEG(); // cpb_size_value_minus1
                                if (sub_pic_hrd_params_present_flag) {
                                    decoder.readUEG(); // cpb_size_du_value_minus1
                                    decoder.readUEG(); // bit_rate_du_value_minus1
                                }
                                decoder.readBits(1); // cbr_flag
                            }
                        }
                    }
                }

                if (vui_num_units_in_tick > 0 && vui_time_scale > 0) {
                    fps = vui_time_scale / vui_num_units_in_tick;
                }
            }

            const bitstream_restriction_flag = decoder.readBoolean();
            if (bitstream_restriction_flag) {
                decoder.readBoolean(); // tiles_fixed_structure_flag
                decoder.readBoolean(); // motion_vectors_over_pic_boundaries_flag
                decoder.readBoolean(); // restricted_ref_pic_lists_flag
                decoder.readUEG(); // min_spatial_segmentation_idc
                decoder.readUEG(); // max_bytes_per_pic_denom
                decoder.readUEG(); // max_bits_per_min_cu_denom
                decoder.readUEG(); // log2_max_mv_length_horizontal
                decoder.readUEG(); // log2_max_mv_length_vertical
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
    static get TRAIL_N()     { return  0; }
    static get TRAIL_R()     { return  1; }
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
            [NALU265.TRAIL_N]:     'TRAIL_N',
            [NALU265.TRAIL_R]:     'TRAIL_R',
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
        return `${NALU265.TYPES[this.type()] || 'UNKNOWN (' + this.type() + ')'}: Layer: ${this.nuhLayerId}, Temporal Id: ${this.nuhTemporalIdPlus1}`;
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
        // skip NALu type
        decoder.readUByte();
        decoder.readUByte();

        // first_slice_segment_in_pic_flag
        this._isFirstSlice = decoder.readBoolean();

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
