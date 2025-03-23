import {createLogger, format, transports} from "winston";

const {combine, timestamp, printf} = format;
const customFormat = printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}]: ${message}`;
});

export const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        // new transports.File({filename: 'app.log'})
    ],
});