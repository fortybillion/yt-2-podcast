// Dependencies
import winston from 'winston'
import fs from 'fs'

// Local
import config from './config.js'

export default class Filesystem {
  constructor () {
    this.config = config.filesystem
  }

  async deleteFiles (files) {
    return Promise.all(files.map(file => {
      winston.warn(`Deleting outdated file ${this.config.path}/${file}`)
      return fs.promises.rm(`${this.config.path}/${file}`)
    }))
  }

  async getLength (filename) {
    const stat = await fs.promises.stat(`${this.config.path}/${filename}`)
    winston.info(`File size ${stat.size}`)
    return stat.size
  }

  getUrl (filename) {
    return this.config.baseUrl + filename
  }

  async list () {
    return fs.promises.readdir(this.config.path)
  }

  async writeFile (data, filename) {
    return fs.promises.writeFile(`${this.config.path}/${filename}`, data)
  }

  async updateTimestamp (file, date) {
    const ts = new Date(date)
    return fs.promises.utimes(`${this.config.path}/${file}`, ts, ts)
  }

  getTimestamp (file) {
    return fs.statSync(`${this.config.path}/${file}`).mtime
  }
}
