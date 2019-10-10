require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import fs from 'fs'

export const loadCount = () => {
    console.log('Carregando quantidade atual...')
    let countBuffer
    try {
        countBuffer = fs.readFileSync(process.env.STORE_DIRECTORY, 'utf-8')
        countBuffer = Json.parse(countBuffer)
    }
    catch (e) { countBuffer = { "emails": 0, "recipients": 0 } }
    return [Number(countBuffer.emails), Number(countBuffer.recipients)]
}

export const saveCount = (newRecipients) => {
    console.log('Gravando quantidade...')
    let [ emails, recipients ] = loadCount()
    let fileJson = { "emails":  emails + 1, "recipients": recipients + newRecipients }
    const contentString = JSON.stringify(fileJson)
    try {
        fs.writeFileSync(process.env.STORE_DIRECTORY, contentString)
    } catch(err) {
        console.error(err);
      }
}