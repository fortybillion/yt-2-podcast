/* eslint-disable no-unmodified-loop-condition */
import fs from 'fs-promise'
import pipe from 'promisepipe'
import promiseLimit from 'promise-limit'
import winston from 'winston'
import ytdl from '@distube/ytdl-core'
import ytpl from '@distube/ytpl'
import cliProgress from 'cli-progress'
import ffmpeg from 'ffmpeg-cli'

// Local
import sleep from './sleep.js'
import config from './config.js'

function convertDurationToSeconds(duration) {
  // Split the duration string by colon
  const parts = duration.split(':');

  // Convert each part to an integer
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Calculate the total number of seconds
  const totalSeconds = (hours * 3600) + (minutes * 60);

  return totalSeconds;
}

export default class YouTube {
  constructor() {
    this.config = config.youtube
    this.limit = promiseLimit(this.config.promiseLimit)
  }

  async downloadVideo({ id, url }) {
    const info = await ytdl.getInfo(url, { playerClients: ["IOS", "WEB_CREATOR"] })
    const format = ytdl.chooseFormat(info.formats, {
      filter: format => format.mimeType && format.mimeType.indexOf('audio/mp4') >= 0,
      quality: 'highestaudio'
    })
    const stream = ytdl.downloadFromInfo(info, { format })

    let progressBar
    let size = null
    let publishDate = null
    let error = null

    if (config.log.console.enabled) {
      progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
      progressBar.start(0, 0, {
        speed: 'N/A'
      })
    }

    stream.on('info', info => {
      winston.debug(`info: ${JSON.stringify(info, null, 2)}`)
      size = info.size
      publishDate = info.videoDetails.publishDate
    })

    stream.on('progress', (chunkSize, totalDownloaded, total) => {
      if (config.log.console.enabled) {
        progressBar.setTotal(total)
        progressBar.update(totalDownloaded)
      }
    })

    stream.on('error', err => { error = err })
    winston.debug('Waiting for download to start...')
    while (size === null && error === null) { await sleep(100) }
    if (error) { throw error }

    let filePath = `/tmp/${id}.m4a`
    winston.debug('Waiting for download to end...')
    await pipe(
      stream,
      await fs.createWriteStream(filePath))
    winston.debug('Downloaded')

    // m4a from youtube is missing the seek table, which confuses some
    // players. use ffmpeg to fix.
    if (this.config.fixSeekTable) {
      winston.info('Fixing Seek Table')
      const outFilePath = `/tmp/${id}-fixed.m4a`
      ffmpeg.runSync(`-hide_banner -loglevel panic -y -i ${filePath} -acodec copy -movflags faststart ${outFilePath}`)
      filePath = outFilePath
    }

    const stream2 = await fs.createReadStream(filePath)
    return { stream: stream2, size, publishDate }
  }

  async getVideoList() {
    winston.debug(`getVideoList for ${this.config.channel}`)
    const channelId = await ytpl.getPlaylistID(this.config.channel)
    const channel = await ytpl(channelId, {
      limit: this.config.queryLimit || 5
    })

    const regex = this.config.regex
      ? new RegExp(this.config.regex)
      : null

    const items = channel
      .items
      .filter(item => regex == null || regex.test(item.title))
      .filter(item => convertDurationToSeconds(item.duration) >= this.config.minDuration)
      .slice(0, this.config.maxEpisodes)
      .map(item => ({
        title: item.title,
        id: item.id,
        description: item.description,
        filename: `${item.id}.m4a`,
        url: item.shortUrl,
        imageUrl: item.thumbnail
      }))

    return { channel, items }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}
