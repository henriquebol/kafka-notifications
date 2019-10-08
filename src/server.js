// process.stdin.resume(); // keep process alive
require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import { init_kafka } from '../services/kafka'
import { send_email} from './email'

const consumer = init_kafka();

const run = async () => {
 
    console.log('Conectando ao kafka...')
    await consumer.connect()

    console.log('Se inscrevendo no tópico de novos emails...')
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_EMAIL })

    console.log('Iniciando consumo...')
    await consumer.run({
 
        //Recebe email
        eachMessage: async ({ topic, partition, message }) => {

            console.log('Recebendo novo email...')
            const response = JSON.parse(message.value);

            let content = {
                from: process.env.SMTP_SERVER_DEFAULT_SENDER,
                to: response.to,
                subject: response.subject,
                replyTo: response.reply_to,
                text: response.text,
                html: response.html,
                attachments: [
                    {
                        path: __dirname + '/example.jpg',
                    }
                ]
            };

            // Verifica saldo

            // Verifica anexo

            // Verifica SMTP e envia email
            if (send_email(content)) {
                // Success
                // Contagem
            } else {
                // Pause
                // Resume resend e sender (quando o server voltar)
            }
        },
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