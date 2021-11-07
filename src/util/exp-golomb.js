/**
 * Parser for exponential Golomb codes, a variable-bitwidth number encoding scheme used by h264.
*/

export class ExpGolomb {

    constructor(data) {
        this.data = data;
        this.index = 0;
        this.bitLength = data.byteLength * 8;
    }

    setData(data) {
        this.data = data;
        this.index = 0;
        this.bitLength = data.byteLength * 8;
    }

    get bitsAvailable() {
        return this.bitLength - this.index;
    }

    skipBits(size) {
        // console.log(`  skip bits: size=${size}, ${this.index}.`);
        if (this.bitsAvailable < size) {
            //throw new Error('no bytes available');
            return false;
        }
        this.index += size;
    }

    readBits(size, moveIndex = true) {
        // console.log(`  read bits: size=${size}, ${this.index}.`);
        const result = this.getBits(size, this.index, moveIndex);
        // console.log(`    read bits: result=${result}`);
        return result;
    }

    getBits(size, offsetBits, moveIndex = true) {
        if (this.bitsAvailable < size) {
            //throw new Error('no bytes available');
            return 0;
        }
        const offset = offsetBits % 8;
        const byte = this.data[(offsetBits / 8) | 0] & (0xff >>> offset);
        const bits = 8 - offset;
        if (bits >= size) {
            if (moveIndex) {
                this.index += size;
            }
            return byte >> (bits - size);
        } else {
            if (moveIndex) {
                this.index += bits;
            }
            const nextSize = size - bits;
            return (byte << nextSize) | this.getBits(nextSize, offsetBits + bits, moveIndex);
        }
    }

    skipLZ() {
        let leadingZeroCount;
        for (leadingZeroCount = 0; leadingZeroCount < this.bitLength - this.index; ++leadingZeroCount) {
            if (this.getBits(1, this.index + leadingZeroCount, false) !== 0) {
                // console.log(`  skip LZ  : size=${leadingZeroCount}, ${this.index}.`);
                this.index += leadingZeroCount;
                return leadingZeroCount;
            }
        }
        return leadingZeroCount;
    }

    skipUEG() {
        this.skipBits(1 + this.skipLZ());
    }

    skipEG() {
        this.skipBits(1 + this.skipLZ());
    }

    readUEG() {
        const prefix = this.skipLZ();
        return this.readBits(prefix + 1) - 1;
    }

    readEG() {
        const value = this.readUEG();
        if (0x01 & value) {
            // the number is odd if the low order bit is set
            return (1 + value) >>> 1; // add 1 to make it even, and divide by 2
        } else {
            return -1 * (value >>> 1); // divide by two then make it negative
        }
    }

    readBoolean() {
        return this.readBits(1) === 1;
    }
    readUByte(numberOfBytes = 1) {
        return this.readBits((numberOfBytes * 8));
    }
    readUShort() {
        return this.readBits(16);
    }
    readUInt() {
        return this.readBits(32);
    }
}

