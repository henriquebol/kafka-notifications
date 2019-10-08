require('dotenv').config({ path: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env" })
import { Kafka, logLevel } from 'kafkajs'

export function init_kafka() { 

    const kafka = new Kafka({
        brokers: [process.env.KAFKA_BROKER],
        clientId: process.env.KAFKA_CLIENT_ID,
         retry: {
             initialRetryTime: 100,
             retries: 8
         },
         logLevel: logLevel.ERROR
      })

    return kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID })
}
