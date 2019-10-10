require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
var ping = require ("ping")

export const serverIsAlive = (server) => {

    console.log('ENTOUR', server)
    ping.sys.probe(server, function(isAlive){
        console.log('isAlive', isAlive)
        return isAlive ? true : false
    })
}

export const getAttachmentsPath = (attachmentsList, app) => {
    let attachments = []
    attachmentsList.forEach( file =>{
        let filename = file.attachment_file_name
        let path = app == "solar" ? process.env.MEDIA_DIRECTORY_SOLAR + file.id + '_' + file.attachment_file_name : file.attachment_file_name
        attachments.push({ filename, path })
    })
    console.log('attachments_mail', attachments)

    return attachments
}