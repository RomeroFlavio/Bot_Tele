import mongoose from 'mongoose';
import { store } from './bot.js';

// URI de conexión a MongoDB Atlas
//const uri = 'mongodb+srv://flaviosromero:T7sHNCMNH9G3n1j3@cluster0.vukod.mongodb.net/';
//const uri = 'mongodb+srv://hfranco:loRbqEk5I1lQ4Bn6@hernanfranco96.fgepwef.mongodb.net/';

// URI de conexión a BaseLocal
const uri = 'mongodb://10.10.128.181:27017/activaciones_api_labs' //local_labs

// Conectar con MongoDB utilizando Mongoose
mongoose.connect(uri, {

});
const db = mongoose.connection;
db.on('error', (err) => {
    console.error(err);
});
db.once('open', () => {
    //console.log('Conectado a MongoDB');
});

// Definir modelo para clientes
const clienteSchema = new mongoose.Schema({
    chatId: String,
    status: Boolean,
    tecnico: String,
    numeroCliente: String,
    tipoOrden: String,
    tecnologiaRetirada: String,
    macRetiradaRouter: String,
    tecnologiaInstalada: String,
    macInstaladaSM: String,
    macInstaladaRouter: String,
    nodo: String,
    ap: String,
    ipAp: String,
    macFisica: String,
    gpon: String,
    drop: String,
    roseta: String,
    tvbox: String,
    tvboxr: String,
    costo: String,
    maximoCupo: String,
    datoAdicional: String,
    agent: String,
    fotos: [Buffer],
},
    {
        timestamps: true,
    }
);

const cliente = mongoose.model('ClientesPendientes', clienteSchema);

export async function procesarCliente(ctx) {
    try {
        // Filtrar por número de cliente
        const chatId = ctx.chat.id;
        const filtro = { numeroCliente: store.chats[chatId].numeroCliente };
        const tecnico = `${ctx.chat.first_name} ${ctx.chat.last_name}`;

        // Buscar cliente existente
        const clienteExistente = await cliente.findOne(filtro);

        if (clienteExistente) {
            const tiempoGuardado = Date.now() - new Date(clienteExistente.createdAt).getTime();
            const segundos = Math.floor(tiempoGuardado / 1000);
            const minutos = Math.floor(segundos / 60);
            const horas = Math.floor(minutos / 60);
            const dias = Math.floor(horas / 24);

            let tiempoTranscurrido = '';
            if (dias > 0) {
                tiempoTranscurrido = `${dias} día(s)`;
            } else if (horas > 0) {
                tiempoTranscurrido = `${horas} hora(s)`;
            } else if (minutos > 0) {
                tiempoTranscurrido = `${minutos} minuto(s)`;
            } else {
                tiempoTranscurrido = `${segundos} segundo(s)`;
            }

            // Si el cliente ya existe, enviar un mensaje de notificación
            ctx.reply(`El cliente ${store.chats[chatId].numeroCliente} ya fue cargado por ${store.chats[chatId].tecnico} hace ${tiempoTranscurrido}.`);
        } else {
            // Si no existe, crear un nuevo cliente pasando directamente "datos"
            const nuevoCliente = new cliente({
                chatId: chatId,
                status: false,
                tecnico: tecnico || 'NoDefinido',
                numeroCliente: store.chats[chatId].numeroCliente,
                tipoOrden: store.chats[chatId].tipoOrden,
                tecnologiaRetirada: store.chats[chatId].tecnologiaRetirada,
                macRetiradaRouter: store.chats[chatId].macRetiradaRouter,
                tecnologiaInstalada: store.chats[chatId].tecnologia,
                macInstaladaSM: store.chats[chatId].macInstaladaSM,
                macInstaladaRouter: store.chats[chatId].macInstaladaRouter,
                nodo: store.chats[chatId].nodo,
                ap: store.chats[chatId].ap,
                ipAp: store.chats[chatId].ipAp,
                macFisica: store.chats[chatId].macFisica,
                gpon: store.chats[chatId].gponInsta,
                drop: store.chats[chatId].drop,
                roseta: store.chats[chatId].roseta,
                tvbox: store.chats[chatId].tvBox,
                tvboxr: store.chats[chatId].tvBoxR,
                costo: store.chats[chatId].costo,
                maximoCupo: store.chats[chatId].maximoCupo,
                datoAdicional: store.chats[chatId].datoAdicional,
                agent: '',
                fotos: store.chats[chatId].fotos,

            });

            // Guardar el nuevo cliente
            await nuevoCliente.save();
            ctx.reply(`El cliente ${store.chats[chatId].numeroCliente} ha sido guardado con éxito.`, {
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
            store.vaciarChat(chatId);
        }
    } catch (err) {
        // Manejo de errores
        ctx.reply('Error al verificar o guardar el cliente');
        console.error(err);
    }
}