import { store, ver, bot } from './bot.js'
import { procesarCliente } from './schemas.js'
import { buscarClienteEnColecciones } from './estado.js'
import { obtenerDatosDeNodos, obtenerDatosDePlaza } from './obtenerIP.js'
import { procesarCodigoBarra } from './barcodeReader.js'
import { handlePhotoDownload } from './funcionFoto.js'
import { sendMessageToWeb } from './chat.js'
import { handleAudioDownload } from './funcionAudio.js';




export async function arbolMessage(ctx, estado, opcion) {
    const chatId = ctx.chat.id;
    const tecnico = `${ctx.chat.first_name} ${ctx.chat.last_name}`;

    let datos = {};
    switch (estado) {
        case 'test':
            ctx.reply('manda audio');
            store.actualizarEstado(chatId, 'audio');
            break
        case 'chat':
            if (store.chats[chatId].chat === '1') {
                sendMessageToWeb(ctx, tecnico, chatId, store.chats[chatId].chatOP);
            } else if (store.chats[chatId].chat === '0') {
                ctx.reply('El chat fue finalizado');
            } else { }
            break
        case 'nuevo'://1
            ctx.reply('Por favor, ingrese solo número de cliente');
            store.actualizarEstado(chatId, 'numeroCliente');
            break
        case 'estado':
            ctx.reply('Ingrese numero de cliente para verificar en que estapa se encuentra', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Salir', callback_data: 'salir' },
                        ],
                    ],
                },
            });
            store.actualizarEstado(chatId, 'consultaDeEstado');
            break;
        case 'consultaDeEstado':
            const clienteFormatado = `TPP-${opcion}`;
            buscarClienteEnColecciones(clienteFormatado)
                .then((resultado) => {
                    ctx.reply(resultado.mensaje, {
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
                    console.log(resultado.mensaje);  // Mostrar el mensaje sobre el resultado de la búsqueda
                })
                .catch((error) => {
                    console.error('Error en la búsqueda:', error);
                });
            store.vaciarChat(chatId);
            break
        case 'numeroCliente'://2
            if (opcion === 'salir') {
                store.vaciarChat(chatId)
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
            } else if (!/^[0-9]{7}$/.test(opcion)) {
                ctx.reply('Por favor, ingrese solo números y verifique que sean 7 caracteres');
            } else {
                const clienteFormatado = `TPP-${opcion}`;
                store.actualizarChat(chatId, 'numeroCliente', clienteFormatado);
                ctx.reply('Seleccione tipo de orden:', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Instalación', callback_data: 'instalacion' },
                                { text: 'Mantenimiento', callback_data: 'mantenimiento' },
                            ],
                            [
                                { text: 'Mudanza', callback_data: 'mudanza' },
                                { text: 'Factibilidad negativa', callback_data: 'baja' },
                            ],
                            [
                                { text: 'Salir', callback_data: 'salir' }
                            ],
                        ],
                    },
                });
                store.actualizarEstado(chatId, 'mismoEquipo');
            }
            break
        case 'bucle'://6
            if (!/^[0-9A-Fa-f]{12}$/.test(opcion) && !/^ztegd4[0-9A-Fa-f]{12}$/.test(opcion)) {
                ctx.reply('El valor debe ser hexadecimal, de 12 caracteres, sin caracteres especiales, ni espacios');
            } else {
                if (store.chats[chatId].tipoOrden === 'mantenimiento' && store.chats[chatId].mismosEquipos === 'false' || store.chats[chatId].tipoOrden === 'mudanza' && store.chats[chatId].mismosEquipos === 'false') {
                    store.actualizarChat(chatId, 'tecnologiaRetirada', opcion);
                    arbolCQ(ctx, 'tipoInstalacion', 'true');
                    break
                } else if (store.chats[chatId].tipoOrden === 'baja' && store.chats[chatId].mismosEquipos === 'false') {
                    store.actualizarChat(chatId, 'tecnologiaRetirada', opcion);
                    ctx.reply('Router retirado?');
                    store.actualizarEstado(chatId, 'bucleRouter');
                    break
                } else if (store.chats[chatId].mismosEquipos === 'true' && store.chats[chatId].tipoConexion === 'inalambrico') {
                    store.actualizarChat(chatId, 'macInstaladaSM', opcion);
                    ctx.reply('tome foto de la MAC del SM');
                } else if (store.chats[chatId].mismosEquipos === 'true' && store.chats[chatId].tipoConexion === 'cableado') {
                    store.actualizarChat(chatId, 'gponInsta', opcion);
                    ctx.reply('Ingrese MAC fisica del equipo:');
                    store.actualizarEstado(chatId, 'maczte');
                    break
                } else { }
                store.actualizarEstado(chatId, 'fotosm');
            }
            break
        case 'ipAP':
            store.actualizarChat(chatId, 'ap', opcion);
            if (store.chats[chatId].tipoConexion === 'inalambrico') {
                obtenerDatosDeNodos(ctx, store.chats[chatId].ap);
            } else if (store.chats[chatId].tipoConexion === 'cableado') {

            } else if (store.chats[chatId].tipoOrden === 'mantenimiento' || store.chats[chatId].tipoOrden === 'mudanza') {
                ctx.reply('¿Cambio router?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Si', callback_data: 'true' },
                                { text: 'No', callback_data: 'false' },
                            ],
                        ],
                    },
                });
                store.actualizarEstado(chatId, 'macRouter');
            } else if (store.chats[chatId].tipoOrden === 'baja') {
                arbolCQ(ctx, 'macRouter', 'true');
            } else { }
            break
        case 'bucleRouter':
            if (store.chats[chatId].mismoRouter === 'false' && store.chats[chatId].tipoOrden !== 'baja') {
                if (!/^[0-9A-Fa-f]{12}$/.test(opcion) && !/^ztegd4[0-9A-Fa-f]{12}$/.test(opcion)) {
                    ctx.reply('el valor debe ser hexadecimal, sin caracteres especiales, ni espacios');
                } else {
                    store.actualizarChat(chatId, 'macInstaladaRouter', opcion);
                    ctx.reply('Foto de la caja del Router o la etiqueda del mismo.');
                    store.actualizarEstado(chatId, 'fotorouter');
                }
            } else if (store.chats[chatId].mismoRouter === 'true' && store.chats[chatId].tipoOrden !== 'baja') {
                if (!/^[0-9A-Fa-f]{12}$/.test(opcion) && !/^ztegd4[0-9A-Fa-f]{12}$/.test(opcion)) {
                    ctx.reply('el valor debe ser hexadecimal, sin caracteres especiales, ni espacios');
                } else {
                    store.actualizarChat(chatId, 'macRetiradaRouter', opcion);
                    arbolCQ(ctx, 'macRouter', 'false');
                }
            } else if (store.chats[chatId].mismosEquipos === 'false' && store.chats[chatId].tipoOrden === 'baja') {
                if (!/^[0-9A-Fa-f]{12}$/.test(opcion) && !/^ztegd4[0-9A-Fa-f]{12}$/.test(opcion)) {
                    ctx.reply('el valor debe ser hexadecimal, sin caracteres especiales, ni espacios');
                } else {
                    store.actualizarChat(chatId, 'macRetiradaRouter', opcion);
                    ctx.reply('(en caso de tenerlo), Ingrese serial de TV BOX.');
                    store.actualizarEstado(chatId, 'tvboxr');
                }
            } else { }
            break
        case 'tvboxr':
            store.actualizarChat(chatId, 'tvBoxR', opcion);
            ctx.reply('(en un solo mensaje), Ingrese dato relevante adicional.\nEJ: trabajo realizado, observacion de equipo, material usado extra, etc');
            store.actualizarEstado(chatId, 'datoAdicional');
            break
        case 'maczte':
            store.actualizarChat(chatId, 'macFisica', opcion);
            ctx.reply('tome una foto de la caja del equipo o la etiqueta del equipo');
            store.actualizarEstado(chatId, 'fotozte');
            break
        case 'datoAdicional':
            store.actualizarChat(chatId, 'datoAdicional', opcion);
            Object.keys(store.chats[chatId]).forEach(key => {
                if (!['true', 'false', undefined, '',].includes(store.chats[chatId][key])) {
                    datos[key] = store.chats[chatId][key];
                }
            });
            ctx.reply(`Datos cargados por ${store.chats[chatId].tecnico}:\n\n${Object.entries(datos)
                .filter(([k]) => !['chatId', 'tecnico', 'estado', 'maximoCupo', 'fotos'].includes(k))
                .map(([k, v]) => `${k}: ${v}`)
                .join('\n')}\n\n        desea finalizar? Si/No.
                `);
            store.actualizarEstado(chatId, 'confirmacion');
            break
        case 'confirmacion':
            if (opcion.toLowerCase() === 'si') {
                procesarCliente(ctx);
            } else if (opcion.toLowerCase() === 'no') {
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
            }
            break
        case 'serialBox':
            store.actualizarChat(chatId, 'tvBox', opcion);
            if (store.chats[chatId].tipoOrden === 'instalacion') {
                arbolCQ(ctx, 'costo', 'abona en mano');
            } else if (store.chats[chatId].tipoOrden === 'baja') {
                arbolCQ(ctx, 'costo', 'sin costo');
            } else {
                ctx.reply('Con costo?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Abona en mano', callback_data: 'abona en mano' },
                                { text: 'Abona contra factura', callback_data: 'abona contra factura' },
                            ],
                            [
                                { text: 'Sin costo', callback_data: 'sin costo' },
                            ],
                        ],
                    },
                });
                store.actualizarEstado(chatId, 'costo');
            }
            break
        case 'salir':
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
            break;
        default:
            ctx.reply(`Opción no valida, Ingrese:`, {
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
            break
    }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function arbolCQ(ctx, estado, opcion) {
    const chatId = ctx.chat.id;
    const tecnico = `${ctx.chat.first_name} ${ctx.chat.last_name}`;

    switch (estado) {
        case 'chat':
            if (store.chats[chatId].chat === '1') {

                // 🟢 AUDIO
                if (ctx.message && (ctx.message.voice || ctx.message.audio)) {
                    const audio = ctx.message.voice || ctx.message.audio;
                    const fileId = audio.file_id;

                    sendMessageToWeb({
                        type: 'audio',
                        file_id: fileId,
                        duration: audio.duration,
                        mime_type: audio.mime_type
                    }, tecnico, chatId, store.chats[chatId].chatOP);

                    ctx.reply('🎧 Audio enviado al chat web.');

                    // 🟣 FOTO
                } else if (ctx.message && ctx.message.photo) {
                    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

                    sendMessageToWeb({
                        type: 'photo',
                        file_id: fileId
                    }, tecnico, chatId, store.chats[chatId].chatOP);

                    ctx.reply('🖼️ Imagen enviada al chat web.');

                    // 🟠 TEXTO
                } else if (ctx.message && ctx.message.text) {
                    sendMessageToWeb(ctx.message.text, tecnico, chatId, store.chats[chatId].chatOP);
                }
            } else if (store.chats[chatId].chat === '0') {
                ctx.reply('El chat fue finalizado');
            }
            break;
        case 'audio':
            handleAudioDownload(ctx, bot);
            break
        case 'cargarFoto':
            handlePhotoDownload(ctx);
            ctx.reply('gracias lokito!');
            //arbolCQ(ctx, 'lector');
            break
        /*case 'lector':
            //ver('Impreso en consola')
            ver(store.chats[chatId].fotos)
            const filePath = './img/AgACAgEAAxkBAAICV2dpctxy1kJ2U6FB6sWbs9JkSp7WAAKErjEbZ_Y5Rju8ztpK0UL7AQADAgADeQADNgQ.jpg'
            procesarCodigoBarra(filePath);
            break*/
        case 'responder':
            store.actualizarChat(chatId, 'chat', '1');
            ctx.reply('chat iniciado');
            store.actualizarEstado(chatId, 'chat');
            break
        case 'mismoEquipo'://3
            store.actualizarChat(chatId, 'tipoOrden', opcion);
            if (store.chats[chatId].tipoOrden === 'instalacion') {
                arbolCQ(ctx, 'tipoInstalacion', 'true');
            } else if (store.chats[chatId].tipoOrden === 'mantenimiento' || store.chats[chatId].tipoOrden === 'mudanza') {
                ctx.reply('¿Mismo equipo?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Si', callback_data: 'true' },
                                { text: 'No', callback_data: 'false' },
                            ],
                        ],
                    },
                });
                store.actualizarEstado(chatId, 'tipoInstalacion');
            } else if (store.chats[chatId].tipoOrden === 'baja') {
                arbolCQ(ctx, 'tipoInstalacion', 'false');
            } else { }
            break
        case 'tipoInstalacion'://4
            store.actualizarChat(chatId, 'mismosEquipos', opcion);
            if (store.chats[chatId].mismosEquipos === 'true') {
                ctx.reply('Tipo de conexion instalada?', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'wireless', callback_data: 'inalambrico' },
                                { text: 'Ethernet', callback_data: 'cableado' },
                            ],
                        ],
                    },
                });
                store.actualizarEstado(chatId, 'instaRetiro');
            } else if (store.chats[chatId].mismosEquipos === 'false') {
                arbolCQ(ctx, 'instaRetiro', 'false');
            } else { }
            break
        case 'instaRetiro'://5
            store.actualizarChat(chatId, 'tipoConexion', opcion);
            if (store.chats[chatId].tipoConexion === 'inalambrico') {
                ctx.reply('serial MAC SM instalado?');
            } else if (store.chats[chatId].tipoConexion === 'cableado') {
                ctx.reply('serial GPON instalado?');
            } else if (store.chats[chatId].tipoConexion === 'false') {
                ctx.reply('serial equipo retirado?');
            } else { }
            store.actualizarEstado(chatId, 'bucle');
            break
        case 'nodo':
            obtenerDatosDePlaza(ctx, opcion, store.chats[chatId].ap);
            break
        case 'macRouter':
            store.actualizarChat(chatId, 'mismoRouter', opcion);
            if (store.chats[chatId].mismoRouter === 'true') {
                ctx.reply('Ingrese MAC Router retirado');
            } else if (store.chats[chatId].mismoRouter === 'false') {
                ctx.reply('Ingrese MAC del Router en posecion del cliente');
            } else { }
            store.actualizarEstado(chatId, 'bucleRouter');
            break
        case 'fotosm':
            handlePhotoDownload(ctx);
            ctx.reply('Ingrese el ultimo octeto del AP');
            store.actualizarEstado(chatId, 'ipAP');
            break
        case 'fotozte':
            handlePhotoDownload(ctx);
            ctx.reply('Drop usado?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '75Mts', callback_data: '75Mts' },
                            { text: '120Mts', callback_data: '120Mts' },
                            { text: '200Mts', callback_data: '200Mts' },
                        ],
                        [
                            { text: 'Edificio', callback_data: 'edificio' },
                        ],
                    ],
                },
            });
            store.actualizarEstado(chatId, 'drop');
            break
        case 'fotorouter':
            handlePhotoDownload(ctx);
            ctx.reply('Con tvBox?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Si', callback_data: 'si' },
                            { text: 'No', callback_data: 'No' },
                        ],
                    ],
                },
            });
            store.actualizarEstado(chatId, 'tvbox');
            break
        case 'drop':
            store.actualizarChat(chatId, 'drop', opcion);
            ctx.reply('con Roseta?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Si', callback_data: 'si' },
                            { text: 'No', callback_data: 'no' },
                        ],
                    ],
                },
            });
            store.actualizarEstado(chatId, 'roseta');
            break
        case 'roseta':
            store.actualizarChat(chatId, 'roseta', opcion);
            ctx.reply('Con tvBox?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Si', callback_data: 'si' },
                            { text: 'No', callback_data: 'No' },
                        ],
                    ],
                },
            });
            store.actualizarEstado(chatId, 'tvbox');
            break
        case 'tvbox':
            if (opcion === 'si') {
                ctx.reply('Ingrese el codigo de barra');
                store.actualizarEstado(chatId, 'serialBox');
                break
            } else if (opcion === 'no') {
                arbolMessage(ctx, 'serialBox');
            }
            break
        case 'costo':
            store.actualizarChat(chatId, 'costo', opcion);
            ctx.reply('(en un solo mensaje), Ingrese dato relevante adicional.\nEJ: trabajo realizado, observacion de equipo, material usado extra, etc');
            store.actualizarEstado(chatId, 'datoAdicional');
            break
        case 'salir':
            store.vaciarChat(chatId)
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
            break
        default:
            ctx.reply(`2 Opción no valida, Ingrese:`, {
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
            break
    }
}

//        console.log(store.chats[chatId].numeroCliente);
//        console.log(store.chats[chatId].tipoOrden);
//        arbolCQ(ctx, 'mismosEquipos', 'true');
//        ctx.deleteMessage(ctx.message.message_id - 1);
//        store.actualizarChat(chatId, 'tecnologiaInstalada', opcion.replace('tecnologia_', ''));
/*
ctx.answerCbQuery();
ctx.deleteMessage(ctx.callbackQuery.message.message_id);

/^[0-9A-Fa-f]+$/.test(valor) verifica si el valor es hexadecimal
!isNaN(parseInt(valor, 16)) lo mismo

/^[0-9A-Fa-f]+$/.test(valor) && valor.length === 12      lo mismo pero con cantidad de caracteres.
*/