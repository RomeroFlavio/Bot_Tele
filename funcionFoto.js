import axios from 'axios';
import { store, ver, bot } from './bot.js'
import { procesarCodigoBarra} from './barcodeReader.js'

// Función que maneja el evento de captura y descarga de foto usando ctx
export function handlePhotoDownload(ctx) {
    const chatId = ctx.chat.id; // Obtén el ID del chat desde el contexto de Telegraf
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id; // Obtener el file_id de la foto de mayor resolución

    // Llama a la función para descargar y almacenar la imagen en Buffer
    downloadImage(bot, fileId, chatId, store, ctx);
}

// Función para descargar la imagen desde el bot de Telegram
async function downloadImage(bot, fileId, chatId, store, ctx) {
    try {
        // Obtener el enlace de la imagen desde Telegram
        const fileLink = await bot.telegram.getFileLink(fileId);
        
        // Descargar la imagen como buffer
        const response = await axios({
            url: fileLink.href,
            responseType: 'arraybuffer'  // Cambiar a arraybuffer para obtener el Buffer
        });

        const bufferImagen = Buffer.from(response.data, 'binary'); // Convertir los datos en un Buffer

        // Almacenar la imagen en el ChatStore usando el Buffer
        store.agregarImagenBuffer(chatId, bufferImagen);
        //ver(bufferImagen)
        const codigoBarra = await procesarCodigoBarra(bufferImagen, ctx, chatId);

        // Enviar confirmación al usuario
        //bot.telegram.sendMessage(ctx.chat.id, 'Imagen almacenada con éxito en el chat.');
    } catch (error) {
        console.error('Error al descargar la imagen:', error);
        bot.telegram.sendMessage(ctx.chat.id, 'Hubo un error al descargar la imagen.');
    }
}