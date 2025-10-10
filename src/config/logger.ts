import winston from 'winston';
import { config } from './env';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
);

const transports = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
    new winston.transports.File({
        filename: config.logging.file,
        format,
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format,
    }),
];

const logger = winston.createLogger({
    level: config.logging.level,
    levels,
    format,
    transports,
    exitOnError: false,
});

export default logger;
