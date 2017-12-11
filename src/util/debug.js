let logger;
let errorLogger;

export function setLogger() {
    /*eslint-disable */
    logger = console.log;
    errorLogger = console.error;
    /*eslint-enable */
}

export function isEnable() {
    return logger != null;
}

export function log(message, ...optionalParams) {
    if (logger) {
        logger(message, ...optionalParams);
    }
}
export function error(message, ...optionalParams) {
    if (errorLogger) {
        errorLogger(message, ...optionalParams);
    }
}
