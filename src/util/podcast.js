// Dependencies
import _ from 'lodash'
import mime from 'mime-types'
import PodcastModule from 'podcast'

// Local
import config from './config.js'

export default class Podcast {
  constructor(imageUrl) {
    this.config = config.podcast
    this.config.feed.pubDate = new Date()
    this.config.feed.image_url = imageUrl
    this.feed = new PodcastModule(this.config.feed)
  }

  addItem(title, description, url, date, duration, filename, size, mtime, imageUrl) {
    const item = _.extend(
      this.config.item,
      {
        title: title,
        description: description,
        url: url,
        date: mtime,
        itunesSummary: description,
        itunesDuration: duration,
        itunesSubtitle: title,
        enclosure: {
          url: url,
          size: size,
          mime: mime.lookup(filename)
        },
        image_url: imageUrl
      })
    this.feed.item(item)
  }

  generate() {
    return this.feed.xml()
  }
}
