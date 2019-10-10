require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import { createTransport } from 'nodemailer'
import { loadCount } from './files'

export const sendEmail = async (content) => { 
    console.log("Iniciando o nodemailer...")
    let transporter = createTransport({
        host: process.env.SMTP_SERVER_HOST ,
        port: process.env.SMTP_SERVER_PORT,
        secure: JSON.parse(process.env.SMTP_SERVER_SECURE),
        ignoreTLS: JSON.parse(process.env.SMTP_SERVER_IGNORE_TLS)
    }, {
        // Default options for the message. Used if specific values are not set
        from: process.env.SMTP_SERVER_DEFAULT_SENDER
    })

    console.log('Verificando servidor...')
    await transporter.verify( error => { if (error) return false } )


    console.log('Enviando email...')
    await transporter.sendMail(content)
    .then((info, response) => {
        // console.log(info)
        // console.log("messageId",info.messageId)
        // console.log("envelope", info.envelope)
        // console.log("accepted", info.accepted)
        // console.log("rejected", info.rejected)
        // console.log("pending", info.pending)
        // console.log("response", response)
        console.log('Email enviado com sucesso!')
        return true
    }).catch((err) => {
        console.log('Error: ', err.message)
        return false
    })
}

export const emailAdmin = (server) => {
    let content = {
        to: process.env.EMAIL_ADMIN,
        subject:  process.env.SUBJECT_ADMIN,
        text:  process.env.MESSAGE_ADMINN
    }
    sendEmail(content)
}

export const mountEmail = (response, attachments = null) => {
    let content = {
        from: process.env.SMTP_SERVER_DEFAULT_SENDER,
        to: response.to,
        subject: response.subject,
        replyTo: response.reply_to,
        text: response.content,
        html: response.content,
    }

    return attachments == null ? content : {...content, ...attachments}
}

export const limitExceeded = () => {
    let [ emails, recipients ] = loadCount()
    if(emails >= process.env.SMTP_SERVER_MAX_EMAILS_PER_DAY || recipients >= process.env.SMTP_SERVER_MAX_RECIPIENTS_PER_DAY)
        return true
}



