export function appendByteArray(buffer1, buffer2) {
    let tmp = new Uint8Array((buffer1.byteLength|0) + (buffer2.byteLength|0));
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.byteLength|0);
    return tmp;
}

export function secToTime(sec) {
    let seconds,
        hours,
        minutes,
        result = '';

    seconds = Math.floor(sec);
    hours = parseInt(seconds / 3600, 10) % 24;
    minutes = parseInt(seconds / 60, 10) % 60;
    seconds = (seconds < 0) ? 0 : seconds % 60;

    if (hours > 0) {
        result += (hours < 10 ? '0' + hours : hours) + ':';
    }
    result += (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
    return result;
}

export function reverseBits(n) {
    var result = 0;
    for (var i = 0; i < 32; i++)
    {
        // Shift result left to make room
        result <<= 1;
        // Add the least significant bit of n
        result |= (n & 1);
        // Shift n right to process the next bit
        n >>>= 1;
    }
    // Ensure result is treated as unsigned 32-bit
    return result >>> 0;
}

export function removeTrailingDotZero(input) {
    // Use regex to strip all trailing ".0" sequences
    return input.replace(/(?:\.0)+$/, '');
}
