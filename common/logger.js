var winston = require('winston');
require('winston-daily-rotate-file');
var config = require('nconf');

var formatMsg = function(info) {
    return `${info.timestamp} ${info.level}: ${info.message}`;
};

var logger = winston.createLogger({
    level: config.get('logger:level'),
    transports: [
        new (winston.transports.Console)({
            format: winston.format.combine(
                winston.format.splat(),
                winston.format.colorize(),
                winston.format.timestamp({
                    format: 'YYYY-MM-DDTHH:mm:ss.SSS'
                }),
                winston.format.printf(formatMsg)
            ),
            handleExceptions: true
        }),
        new (winston.transports.DailyRotateFile)({
            dirname: config.get('logger:dirname'),
            filename: config.get('logger:filename'),
            datePattern: 'YYYY-MM-DD',
            format: winston.format.combine(
                winston.format.uncolorize(),
                winston.format.splat(),
                winston.format.timestamp({
                    format: 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
                }),
                winston.format.printf(formatMsg)
            ),
            handleExceptions: true
        })
    ],
    exitOnError: false
});

logger.stream = {
    write: function(message) {
        logger.info(message.slice(0, -1));
    }
};

logger.db = function(collectionName, method, query, doc, options) {
    // LOG format: Mongoose: exams.find({ student: ObjectId("55633e000cf842a221a37ae3") }) { sort: { beginDate: 1 }, fields: undefined } 
    logger.debug('Mongoose: %s.%s(%s) %s', collectionName, method, JSON.stringify(query), JSON.stringify(doc));
};

module.exports = logger;
