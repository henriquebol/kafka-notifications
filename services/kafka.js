require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import { Kafka, logLevel } from 'kafkajs'
import cron from 'node-cron'


export function initKafka() { 

    const kafka = new Kafka({
        brokers: [process.env.KAFKA_BROKER],
        clientId: process.env.KAFKA_CLIENT_ID,
         retry: {
             initialRetryTime: 100,
             retries: 8
         },
         logLevel: logLevel.ERROR
      })

    return [ kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID }), kafka.producer() ]
}

export function commitOffset(){
    consumer.commitOffsets([
        { topic: process.env.KAFKA_TOPIC_EMAIL, partition, offset: '1' }
    ])
}

export const attemptsExceededEmailFailed = (attempts, producer, message, headers) => {
    let resendMessage = { ...message, headers }
    if (Number(attempts) >= process.env.MAIL_RESEND_ATTEMPTS){
        producer.send({ topic: process.env.KAFKA_TOPIC_EMAIL_FAIL, 
            messages: [ { value: resendMessage } ]
        })
        return true
    }
    return false
}

export const resendToQueue = (producer, message, headers) => {
    let resendMessage = { ...message, headers }
    producer.send({ topic: process.env.KAFKA_TOPIC_EMAIL, 
        messages: [ { value: resendMessage } ]
    })
    return true
}

export const newAttempt = (producer, header, response) => {
    let new_header = { ...header, attempts: Number(response.attempts) + 1 }
    resendToQueue(producer, response, new_header)
}

export const pauseConsumer = (consumer, producer, message) => {
    // Pause sender
    consumer.pause([ process.env.KAFKA_TOPIC_EMAIL ])
    console.log('Consumo de emails interrompido. Limite alcançado.', )

    // Envia para o fim da fila
    resendToQueue(producer, message)
    console.log('Enviando mensagem atual para o fim da fila.', )


    // Continua depois das 01h
    console.log('Agendando retorno para as 1h do dia seguinte.', )
    cron.schedule('0 1 * * *', () => {
        console.log('Continuando o consumo de emails.')
        consumer.resume([ process.env.KAFKA_TOPIC_EMAIL ])
    }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    })

    return true
}