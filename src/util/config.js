// Dependencies
import fs from 'fs'

const config = (if (process.argv[2])
    ? JSON.parse(fs.readFileSync(process.argv[2]))
        : JSON.parse(fs.readFileSync('./config.json'))
// Module
export default config
