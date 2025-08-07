// logger.js - Sistema di logging configurabile
const winston = require('winston');

// Configurazione logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'server.log',
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

// Funzione per ottenere il logger
function getLogger() {
  return logger;
}

module.exports = {
  getLogger
};
