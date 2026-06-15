import Pino from 'pino'

class Logger {
  constructor() {
    this.logger = Pino({
      level: 'info',
      timestamp: false
    })
  }

  info(message) {
    this.logger.info(message)
  }

  error(message) {
    this.logger.error(message)
  }
}

export { Logger }
