const { format, createLogger, transports } = require('winston');
const fs = require('fs');
require('winston-daily-rotate-file');

const expressWinston = require('express-winston');

const consoleFormat = format.printf(info => {
  return `time: ${info.timestamp} ${info.level}: ${info.message} status: ${
    info.res.statusCode
  }`;
});

const accessLogger = (folderName, application, rotate, logstash) => {
  const prefix = application || 'combined';

  folderName = createLogFolder(folderName);

  let accessTransportsArray = (errorTransportArray = [
    new transports.Console({
      format: format.json()
    })
  ]);

  // if rotate is specified
  if (rotate) {
    accessTransportsArray = [
      ...accessTransportsArray,
      new transports.DailyRotateFile({
        filename: `${folderName}/${prefix}-access-%DATE%.log`,
        zippedArchive: true
      })
    ];

    errorTransportArray = [
      ...errorTransportArray,
      new transports.DailyRotateFile({
        filename: `${folderName}/${prefix}-error-%DATE%.log`,
        zippedArchive: true
      })
    ];
  }

  if (logstash) {
    accessTransportsArray = [
      ...accessTransportsArray,
      new transports.DailyRotateFile({
        format: format.logstash(),
        filename: `${folderName}/logstash-access-%DATE%.log`,
        zippedArchive: true
      })
    ];

    errorTransportArray = [
      ...errorTransportArray,
      new transports.DailyRotateFile({
        format: format.logstash(),
        filename: `${folderName}/logstash-error-%DATE%.log`,
        zippedArchive: true
      })
    ];
  }

  return expressWinston.logger({
    winstonInstance: createLogger({
      transports: accessTransportsArray
    })
  });
};

const errorLogger = filename => {
  return expressWinston.errorLogger({
    winstonInstance: createLogger({
      transports: errorTransportArray
    })
  });
};

const createLogFolder = folderName => {
  fs.existsSync(folderName) || fs.mkdirSync(folderName);
  return folderName;
};

const forceHttpsRedirect = (https, status) => {
  status = status || 302;
  return (req, res, next) => {
    if (!https) return next();
    if (req.headers['x-forwarded-proto'] == 'https') return next();
    return res.redirect(status, `https://${req.hostname + req.originalUrl}`);
  };
};

module.exports = {
  accessLogger,
  errorLogger,
  forceHttpsRedirect
};
