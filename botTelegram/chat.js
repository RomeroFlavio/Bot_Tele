import fetch from 'node-fetch';  // Necesario para hacer peticiones HTTP
import {ver } from './bot.js'

const url = 'http://192.168.131.117:3000/respuesta'; // hernan
//const url = 'http://10.10.128.181:3000/respuesta'; // servidor web

export function sendMessageToWeb(message, tecnico, chatId, op) {

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, tecnico, chatId, op}),  // Enviar el mensaje y el ID del usuario
    })
        .then(response => response.json())
        .then(data => {
            //console.log('Mensaje enviado de la web:', data);
        })
        .catch(error => {
            console.error('Error al enviar mensaje a la web:', error);
        });
}

//const message = ctx.message.text
//const userId = ctx.from.id;