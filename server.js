// process.stdin.resume() // keep process alive
require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import { initKafka, attemptsExceededEmailFailed, resendToQueue, pauseConsumer, commitOffset } from './services/kafka'
import { sendEmail, emailAdmin, limitExceeded, mountEmail } from './core/email'
import { serverIsAlive, getAttachmentsPath } from './core/servers'
import { saveCount } from './core/files'

const [ consumer, producer ] = initKafka()

const run = async () => {
 
    console.log('Conectando ao kafka...')
    await consumer.connect()

    console.log('Se inscrevendo no tópico de novos emails...')
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_EMAIL })

    console.log('Iniciando consumo...')
    await consumer.run({

        // autoCommit: true,
        // autoCommitThreshold: 1,

        /* 
        ############################ 
        ####### RECEBE EMAIL #######
        ############################  

        topic ->
        partition ->
        message
            offset ->
            timestamp ->
            headers
                app (SOLAR) ->
                attachment (path, content, raw) ->
                attempts (number) ->
            value
                from ->
                to ->
                subject ->
                content ->
                replyTo ->
                attachments ->
        */
        eachMessage: async ({ topic, partition, message }) => {

            console.log('Recebendo novo email...')
            const response = JSON.parse(message.value)

            const headers = message.headers
            const app = headers.app.toString()
            const attachmentType = headers.attachment.toString()
            const attachmentList = response.attachments

            let attempts = message.headers.attempts.toString()
            let attachments = []
            let email = {}
 
            // Verifica número de tentativas.
            // Se maior ou igual a 3, envia para o tópico email_fail e retorna
            console.log('Verificando o número de tentativas...')
            if (attemptsExceededEmailFailed(attempts, producer, response, headers)) return 

            // Verifica limite de envio de emails diários
            console.log('Verificando limites...')
            // Se ultrapassou, pausa o consumo, envia para fila e continua às 1h do dia seguinte
            if (limitExceeded()) { 
                pauseConsumer(consumer, producer, response)
                return 
            }

            // Verifica se tem anexo
            console.log('Verificando anexos...')
            if (attachmentList.length > 0) {
                switch (attachmentType) {
                    case 'path':
                        // Se servidor de midias insidsponível, manda para fila para reenviar, envia alerta e retorna.
                        console.log('Verificando servidor de anexo...')
                        let server = app === "solar" ? process.env.MEDIA_HOST_SOLAR : ''
                        if (!serverIsAlive([server])) { 
                            resendToQueue(producer, response, headers)
                            emailAdmin(server)
                            return
                            // break
                        }

                        // Configura anexos
                        console.log('Anexando arquivos...')
                        attachments = getAttachmentsPath(attachmentList, app)

                        // Monta email com anexo
                        console.log('Montando email com anexo...')
                        email = mountEmail(response, attachments)

                        break
                    }

             // Monta email sem anexo
            } else { 
                console.log('Montando email sem anexo...')
                email = mountEmail(response) 
            }

            // Verifica SMTP e envia email
            if (sendEmail(email)) { 
                // Salva quantidades
                saveCount(response.to.length)
            } else { 
                // Envia para nova tetativa
                newAttempt(producer, header, response) 
            }
        }
    })
}
  
run().catch(e => console.error(`[example/consumer] ${e.message}`, e))

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
    process.on(type, async e => {
        try {
        console.log(`process.on ${type}`)
        console.error(e)
        await consumer.disconnect()
        process.exit(0)
        } catch (_) {
        process.exit(1)
        }
    })
})

signalTraps.map(type => {
    process.once(type, async () => {
        try {
        await consumer.disconnect()
        } finally {
        process.kill(process.pid, type)
        }
    })
})