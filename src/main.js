// Dependencies
import winston from 'winston'
import _ from 'lodash'

// Runtime
import './util/log.js'
import Filesystem from './util/filesystem.js'
import Podcast from './util/podcast.js'
import YouTube from './util/youtube.js'

// Local
import config from './util/config.js'

(async () => {
  try {
    // Init
    winston.info('Initializing')
    const youtube = new YouTube()
    const filesystem = new Filesystem()

    // Get data from YouTube
    winston.info('Getting data from channel')
    const { channel, items } = await youtube.getVideoList()
    winston.debug(`channel: ${JSON.stringify(channel, null, 2)}`)
    winston.debug(`items: ${JSON.stringify(items, null, 2)}`)

    // List files in bucket
    winston.info('Listing files in bucket')
    const files = await filesystem.list()

    // Download new files
    const notDownloaded = []
    const itemsToDownload = items.filter(x => !files.includes(x.filename))
    winston.info(`Found ${itemsToDownload.length} items to download`)
    for (const item of itemsToDownload) {
      try {
        winston.info(`Downloading ${item.title} to ${item.filename}`)
        const video = await youtube.downloadVideo(item)
        await filesystem.writeFile(video.stream, item.filename)
        await filesystem.updateTimestamp(item.filename, video.publishDate)
      } catch (e) {
        winston.error(`Skipping ${item.title}`)
        winston.debug(e)
        notDownloaded.push(item)
      }
    }

    // Remove items
    if (notDownloaded.length) {
      winston.info('Removing items that were not downloaded')
      for (const item of notDownloaded) {
        winston.info('Removing', item.title)
        items.splice(items.indexOf(item), 1)
      }
    }

    // Add items
    winston.info('Adding items')
    const podcast = new Podcast(_.get(channel, 'author.bestAvatar.url'))

    for (const item of items) {
      // Get info
      const length = await filesystem.getLength(item.filename)

      // Add to feed
      winston.info(`Adding to feed ${item.title}`)
      podcast.addItem(
        item.title,
        item.description,
        filesystem.getUrl(item.filename),
        item.date,
        item.duration,
        item.filename,
        length,
        filesystem.getTimestamp(item.filename),
        item.imageUrl
      )
    }

    // Upload
    winston.info('Uploading feed')
    const xml = podcast.generate()
    await filesystem.writeFile(xml, config.podcast.xml)

    // Cleanup
    if (config.filesystem.deleteOld) {
      winston.info('Cleanup')
      const uploadedFiles = items.map(x => x.filename)
      const filesToDelete = files
        .filter(x => x.endsWith('.m4a'))
        .filter(x => !uploadedFiles.includes(x))
      if (filesToDelete.length) {
        await filesystem.deleteFiles(filesToDelete)
      }
    }

    process.exit(0)
  } catch (e) {
    winston.error(e.message, e.stack)
  }
})()
