import { store, ver } from './bot.js';
import { arbolCQ, arbolMessage } from './arbol.js';

const valoresPosibles = ['cc', 'cr', 'za', 'es', 'lh', 'nq', 'sa', 'pt'];  // Los valores posibles
const baseUrl = 'http://10.10.128.126/datos-aps.php?plaza=';  // La URL base

export const obtenerDatosDeNodos = async (ctx, ap) => {
    const chatId = ctx.chat.id;
    const nodosEncontrados = new Set();  // Usamos un Set para evitar duplicados

    // Hacer la solicitud a cada valor posible
    for (const valor of valoresPosibles) {
        const url = `${baseUrl}${valor}`;  // Crear la URL completa
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();  // Obtener los datos en formato JSON

                // Filtrar los nodos por el AP y agregar al Set
                data.forEach(item => {
                    if (String(item.ap) === String(ap)) nodosEncontrados.add(item.nodo);
                });
            } else {
                console.error(`Error en la solicitud para ${valor}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error al obtener datos para ${valor}:`, error);
        }
    }

    // Si se encontraron nodos, responder con un teclado de nodos
    if (nodosEncontrados.size > 0) {
        // Convertir el Set de nodos en un array y luego dividir en chunks
        const nodosArray = Array.from(nodosEncontrados);  // Convertir el Set a un array

        // Dividir los nodos en grupos de 2
        const chunks = [];
        for (let i = 0; i < nodosArray.length; i += 2) {
            chunks.push([  // Crear una fila de botones por cada par de nodos
                { text: nodosArray[i], callback_data: nodosArray[i] },
                nodosArray[i + 1] ? { text: nodosArray[i + 1], callback_data: nodosArray[i + 1] } : null
            ].filter(Boolean));  // Eliminar posibles valores null (cuando haya un solo nodo en una fila)
        }

        // Enviar la respuesta con el teclado de nodos  //6
        ctx.reply(`Nodos encontrados para el AP: ${ap}`, {
            reply_markup: {
                inline_keyboard: chunks
            }
        });
        store.actualizarEstado(chatId, 'nodo');
    } else {
        // Si no se encontraron nodos
        ctx.reply(`No se encontraron nodos para el AP: ${ap}`);
    }
};

// Función para hacer la solicitud a cada valor posible y filtrar por nodo y ap
export const obtenerDatosDePlaza = async (ctx, nodo, ap) => {
    const chatId = ctx.chat.id;
    let encontrado = false;  // Variable para rastrear si se encuentra una coincidencia

    for (const valor of valoresPosibles) {
        const url = `${baseUrl}${valor}`;  // Crear la URL completa con el valor
        try {
            const response = await fetch(url);  // Hacer la solicitud HTTP
            if (response.ok) {
                const data = await response.json();  // Convertir la respuesta en JSON

                // Filtrar los datos por nodo y ap
                const datosFiltrados = data.filter(item => {
                    // Comparar nodo de forma insensible a mayúsculas y minúsculas, y con eliminación de espacios extra
                    return item.nodo.trim().toLowerCase() === nodo.trim().toLowerCase() && String(item.ap) === String(ap);
                });

                // Si se encontraron coincidencias, mostrar los datos y detener la ejecución   //8
                if (datosFiltrados.length > 0) {
                    datosFiltrados.forEach(item => {
                        store.actualizarChat(chatId, 'nodo', item.nodo);
                        store.actualizarChat(chatId, 'ipAp', item.ip);
                        store.actualizarChat(chatId, 'maximoCupo', item.maximo);
                        store.actualizarChat(chatId, 'tecnologiaInstalada', item.obs);
                        if (store.chats[chatId].tipoOrden === 'mantenimiento' || store.chats[chatId].tipoOrden === 'mudanza') {
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
                        } else if (store.chats[chatId].tipoOrden === 'instalacion') {
                            arbolCQ(ctx, 'macRouter', 'false');
                        }
                    });
                    encontrado = true;  // Actualizar la variable si se encuentran datos
                    break;
                }
            } else {
                console.error(`Error en la solicitud para ${valor}: ${response.statusText}`);  // Manejo de errores si la respuesta no es OK
            }
        } catch (error) {
            console.error(`Error al obtener datos para ${valor}:`, error);  // Manejo de errores si la solicitud falla
        }
    }

    // Si no se encontraron coincidencias después de todas las iteraciones
    if (!encontrado) {
        ctx.reply(`No se encontraron datos para Nodo: ${nodo} y AP: ${ap}`);
    }
};