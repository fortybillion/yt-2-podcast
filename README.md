# yt-2-podcast
Convert YouTube videos into a Podcast feed with audio files

This project fetches videos from YouTube using the YouTube API and ytdl-core. Then, it generates a podcast XML feed file. The created files can be uploaded/synced to any public file service or web server and fed to your Podcast app as a URL.

## Setup

### Prerequisites

Ensure node 14+ is installed on your system

### Install dependencies

Run: `npm install`

### Setup configuration file

Copy the template file: `cp config.template.json config.json`

Edit the config file config.json

### Launch

Run: `npm start`
