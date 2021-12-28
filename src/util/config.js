// Dependencies
import fs from 'fs'

const config = JSON.parse(fs.readFileSync('./config.json'))
// Module
export default config
