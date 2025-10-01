// Importaciones
import { Telegraf } from 'telegraf';
import { arbolMessage, arbolCQ, } from './arbol.js'
import { obtenerTodos, actualizarEstatus, } from './resueltos.js'
import { obtenerEscaladas, actualizarEscalada, } from './escaladas.js'
import { handlePhotoDownload } from './funcionFoto.js'

// Token de bot de Telegram server
const token = '7899031509:AAFWzEHmOl1H_QotpoXlaWLtsJxsO1svOQw';
// Token de bot de Telegram laboratorio
//const token = '7620932739:AAHv9N1L4fEKcGtSW3PaTIm-lZnDiJ9weQM';
// Crear bot de Telegram
export const bot = new Telegraf(token);
// Store para manejar chats
class ChatStore {
    chats = {};
    constructor() { }
    agregarChat(chatId, tecnico) {
        this.chats[chatId] = {
            chatId,
            tecnico,
            numeroCliente: '',
            tipoOrden: '',
            tipoConexion: '',
            tecnologiaRetirada: '',
            macRetiradaRouter: '',
            tecnologiaInstalada: '',
            macInstaladaSM: '',
            macInstaladaRouter: '',
            nodo: '',
            ap: '',
            ipAp: '',
            macFisica: '',
            gponInsta: '',
            drop: '',
            roseta: '',
            tvBox: '',
            tvBoxR: '',
            costo: '',
            maximoCupo: '',
            datoAdicional: '',
            mismosEquipos: 'false',
            mismoRouter: 'false',
            estado: '',
            chat: '0',
            chatOP: '',
            fotos: [],
        };
    }

    actualizarChat(chatId, campo, valor) {
        if (this.chats[chatId]) {
            this.chats[chatId][campo] = valor;
        }
    }
    // Ejemplo de uso Actualizar número de cliente: actualizarChat('chatId', 'numeroCliente', 'valor capturado');

    actualizarEstado(chatId, estado) {
        this.chats[chatId].estado = estado;
    }
    // Ejemplo de uso actualizar estado: actualizarEstado(chatId, 'el case de la siguiente consulta');

    vaciarChat(chatId) {
        this.chats[chatId] = {};
    }
    // Ejemplo de uso vaciar chat: vaciarChat(chatId);

    agregarImagenBuffer(chatId, bufferImagen) {
        //ver(bufferImagen)
        if (this.chats[chatId]) {
            // Inicializa el array de fotos si no existe
            if (!this.chats[chatId].fotos) {
                this.chats[chatId].fotos = [];
            }
            this.chats[chatId].fotos.push(bufferImagen);  // Ahora se hace push a 'fotos' en lugar de 'imagenes'
        }
    }
    //ejemplo de uso agregar imagenes: 

    eliminarChat(chatId) {
        delete this.chats[chatId];
    }
    // Ejemplo de uso eliminar chat (recordar que esta opcion eliminara por completo el chat): eliminarChat(chatId);
}

export const store = new ChatStore();

// Manejar evento message
bot.on(['message', 'callback_query', 'photo'], async (ctx) => {
    const chatId = ctx.chat.id;
    //const foto = ctx.message.photo;
    const tecnico = `${ctx.chat.first_name} ${ctx.chat.last_name}`;
    store.actualizarChat(chatId, 'tecnico', tecnico);
    if (ctx.message && !store.chats[chatId] || ctx.callbackQuery && !store.chats[chatId]) {
        store.agregarChat(chatId, tecnico);
        store.vaciarChat(chatId);
        ctx.reply(`¡Hola, ${tecnico}!\nRegistrado correctamente ingrese:`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Nuevo', callback_data: 'nuevo' },
                        { text: 'Estado', callback_data: 'estado' },
                        { text: 'Salir', callback_data: 'salir' },
                        { text: 'Test', callback_data: 'test' },
                        { text: 'Finalizar chat', callback_data: 'finalizar chat' },
                    ],
                ],
            },
        })
    } else {
        // Manejar mensaje
        if (ctx.message && ctx.message.text) {
            const texto = ctx.message.text.toLowerCase();

            // Código para manejar message
            if (texto === 'nuevo' || texto === 'estado') {
                store.actualizarChat(chatId, 'estado', texto);
                arbolMessage(ctx, texto);
            } else if (texto === 'salir') {
                store.vaciarChat(chatId)
                ctx.reply('Operación cancelada, ¡Hasta luego!', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Nuevo', callback_data: 'nuevo' },
                                { text: 'Estado', callback_data: 'estado' },
                                { text: 'Salir', callback_data: 'salir' },
                                { text: 'Test', callback_data: 'test' },
                                { text: 'Finalizar chat', callback_data: 'finalizar chat' },
                            ],
                        ],
                    },
                });
            } else if (texto === 'created') {
                ctx.reply('© Powered by Hernan & Flavio.');
            } else if (store.chats[chatId].chat === '1') {
                arbolMessage(ctx, 'chat', texto);
            } else {
                arbolMessage(ctx, store.chats[chatId].estado, texto);
            }
            // Manejar callback_query
        } else if (ctx.callbackQuery) {
            const callbackData = ctx.callbackQuery.data.toLowerCase();
            const parts = callbackData.split(':');
            const action = parts[0]; // 'responder'
            const agente = parts[1]; // El chatId
            store.actualizarChat(chatId, 'chatOP', agente);
            // Código para manejar callback_query
            if (callbackData === 'nuevo' || callbackData === 'estado' || callbackData === 'test') {
                store.actualizarChat(chatId, 'estado', callbackData);
                arbolMessage(ctx, callbackData);
            } else if (callbackData === 'salir') {
                store.vaciarChat(chatId);
                ctx.reply('Operación cancelada, ¡Hasta luego!', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Nuevo', callback_data: 'nuevo' },
                                { text: 'Estado', callback_data: 'estado' },
                                { text: 'Salir', callback_data: 'salir' },
                            ],
                        ],
                    },
                });
            } else if (action === 'responder') {
                arbolCQ(ctx, action, callbackData);
            } else if (callbackData === 'finalizar chat') {
                store.actualizarChat(chatId, 'chat', '0');
                ctx.reply('El chat fue finalizado', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Nuevo', callback_data: 'nuevo' },
                                { text: 'Estado', callback_data: 'estado' },
                                { text: 'Salir', callback_data: 'salir' },
                            ],
                        ],
                    },
                });
            } else {
                arbolCQ(ctx, store.chats[chatId].estado, callbackData);
            }
        } else if (ctx.message && ctx.message.photo) { //PASAR IMAGEN
            const callbackData = 'default';
            arbolCQ(ctx, store.chats[chatId].estado, callbackData);
            //handlePhotoDownload(ctx, bot);
        }
    }
});

// Iniciar bot
bot.startPolling();

setInterval(() => {

    obtenerTodos().then((resolución) => {
        resolución.forEach((datos) => {
            if (datos.status === false) {
                bot.telegram.sendMessage(datos.chatId, `Orden cerrada con exito! \n\nNúmero de cliente: ${datos.numeroCliente}\nTipo de orden: ${datos.tipoOrden}\nTicket/banelco: ${datos.ticket}\n Resolucion: ${datos.msjOp} \n\n Hasta luego ${datos.tecnico}!`);
                actualizarEstatus(datos.idObjeto);
            } else {

            }
        });
    });

    obtenerEscaladas().then((escalado) => {
        escalado.forEach((datos) => {
            if (datos.status === false) {
                bot.telegram.sendMessage(datos.chatId, `Orden escalada\n\nNúmero de cliente: ${datos.numeroCliente}\nTipo de orden: ${datos.tipoOrden}\nMotivo: ${datos.msjOp}\n\nHasta luego ${datos.tecnico}!`);
                actualizarEscalada(datos.idObjeto);
            } else {

            }
        });
    });

}, 15000);

export function ver(valor) {
    console.log(valor);
}

/*///////////////Recuerda reemplazar:////////////////
//TU_TOKEN_DE_BOT con tu token de bot de Telegram.
//usuario, contraseña, nombre-del-clúster y nombre-de-la-base-de-datos con tus credenciales de MongoDB Atlas.

////////Este código combina la funcionalidad de://////////
Guardar mensajes en una base de datos MongoDB Atlas utilizando Mongoose.
Responder a usuarios según el mensaje recibido.*/

//console.dir(ctx, { depth: null }) ver mas datos.