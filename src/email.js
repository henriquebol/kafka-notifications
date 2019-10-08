import { createTransport } from 'nodemailer'

console.log("Iniciando o nodemailer...");
let transporter = createTransport({
    host: process.env.SMTP_SERVER_HOST ,
    port: process.env.SMTP_SERVER_PORT,
    secure: JSON.parse(process.env.SMTP_SERVER_SECURE),
    ignoreTLS: JSON.parse(process.env.SMTP_SERVER_IGNORE_TLS)
});

export const send_email = async (content) => { 

    console.log('Verificando servidor...')
    await transporter.verify( error => { if (error) return false } );


    console.log('Enviando email...')
    await transporter.sendMail(content)
    .then((info, response) => {
        // console.log(info);
        // console.log("messageId",info.messageId);
        // console.log("envelope", info.envelope);
        // console.log("accepted", info.accepted);
        // console.log("rejected", info.rejected);
        // console.log("pending", info.pending);
        // console.log("response", response );
        console.log('Email enviado com sucesso!')
        return true
    }).catch((err) => {
        // Resend
        console.log(err);
        console.log('Error: ', err.message);
        return false
    });
}




