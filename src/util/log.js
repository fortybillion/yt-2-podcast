// Dependencies
import path from 'path'
import winston from 'winston'
import winstoncw from 'winston-cloudwatch'

// Local
import config from './config.js'

// Path
config.log.local.filename = path.join('.', '..', '..', config.log.local.filename)

// Configure
// Console
winston.remove(winston.transports.Console)
if (config.log.console.enabled) {
  winston.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    level: config.log.console.level
  }), config.log.console)
}

// Local
if (config.log.local.enabled) { winston.add(new winston.transports.File(), config.log.local) }

// Cloud watch
if (config.log.cloudwatch.enabled) { winston.add(winstoncw, config.log.cloudwatch) }

// // Dependencies
// // import path from 'path'
// import winston from 'winston'

// winston.configure({
//   format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.simple()
//   ),
//   transports: [
//     new winston.transports.Console({
//       level: 'debug'
//     })
//   ]
// })
