import fs from 'fs';
import { store, ver, bot } from './bot.js';

// Rutas de los archivos
const rutaPermitidos = './whiteList.json';
const rutaBloqueados = './blackList.json';
const rutaPendientes = './waitList.json';
const rutaAdmin = './admin.json';

// ✅ Utilidad: leer archivo JSON (si no existe, devuelve [])
function leerJSON(ruta) {
    try {
        if (!fs.existsSync(ruta)) return [];
        const data = fs.readFileSync(ruta, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        ver(`⚠️ Error al leer ${ruta}: ${error.message}`);
        return [];
    }
}

// ✅ Utilidad: escribir archivo JSON
function escribirJSON(ruta, data) {
    try {
        fs.writeFileSync(ruta, JSON.stringify(data, null, 2));
    } catch (error) {
        ver(`⚠️ Error al escribir ${ruta}: ${error.message}`);
    }
}

// ✅ Verificar si es admin
export function adm(chatId) {
    chatId = String(chatId);
    const adm = leerJSON(rutaAdmin);
    return adm.some(u => parseInt(u.id) === parseInt(chatId));
}

// ✅ Verificar si está permitido
export function estaPermitido(chatId) {
    chatId = String(chatId);
    const permitidos = leerJSON(rutaPermitidos);
    return permitidos.some(u => parseInt(u.id) === parseInt(chatId));
}

// ✅ Verificar si está bloqueado
export function estaBloqueado(chatId) {
    chatId = String(chatId);
    const bloqueados = leerJSON(rutaBloqueados);
    return bloqueados.some(u => parseInt(u.id) === parseInt(chatId));
}

// ✅ Verificar si está pendiente
export function estaPendiente(chatId) {
    chatId = String(chatId);
    const pendientes = leerJSON(rutaPendientes);
    return pendientes.some(u => parseInt(u.id) === parseInt(chatId));
}

//✅ Verificar si está pendiente
export function manejarUsuarios(ctx, bot,) {
    const chatId = parseInt(ctx.chat.id);
    const usuario = `${ctx.chat.first_name} ${ctx.chat.last_name}`;
    const texto = ctx.message?.text || ctx.callbackQuery?.data;

    ver(`ID: ${chatId}\nUsuario: ${usuario}\nTexto: ${texto}`);

    const permitidos = leerJSON(rutaPermitidos);
    const bloqueados = leerJSON(rutaBloqueados);
    const pendientes = leerJSON(rutaPendientes);
    const admins = leerJSON(rutaAdmin);

    if (!permitidos.some(u => u.id === chatId) && !bloqueados.some(u => u.id === chatId)) {

        if (!pendientes.some(u => u.id === chatId)) {
            pendientes.push({ id: chatId, usuario });
            escribirJSON(rutaPendientes, pendientes);

            admins.forEach(admin => {
                if (!store.chats[admin.id]) {
                    store.agregarChat(admin.id, admin.nombre);
                }
                try {
                    bot.telegram.sendMessage(admin.id, `⚠️ Usuario no autorizado detectado:\n\n👤 Nombre: ${usuario}\n🆔 ID: ${chatId}\n💬 Texto: ${texto}\n\n¿Qué desea hacer?`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '✅ Permitir', callback_data: `permitir_${chatId}_${usuario}` },
                                        { text: '🚫 Bloquear', callback_data: `bloquear_${chatId}_${usuario}` },
                                    ],
                                ],
                            },
                        }
                    );
                } catch (error) {
                    ver(`⚠️ Error con admin ${admin.id}: ${error.message}`);
                }
                store.actualizarEstado(admin.id, 'user');
            });
            bot.telegram.sendMessage(chatId, `❌ No registrado\n⏳ Peticion enviada.`);

        } else if (pendientes.some(u => u.id === chatId) || bloqueados.some(u => u.id === chatId)) {
            bot.telegram.sendMessage(chatId, `⏳ Solicitud pendiente.`);
        }
    } else {

    };
};

// ✅ Permitir usuario (mueve de pendientes a permitidos)
export function permitirUsuario(chatId) {
    const pendientes = leerJSON(rutaPendientes);
    const permitidos = leerJSON(rutaPermitidos);

    const usuarios = pendientes.find(u => u.id === chatId);
    if (!usuarios) return false;

    pendientes.splice(pendientes.indexOf(usuarios), 1);
    permitidos.push(usuarios);

    escribirJSON(rutaPendientes, pendientes);
    escribirJSON(rutaPermitidos, permitidos);

    ver(`✅ Usuario ${usuarios.usuario} (${chatId}) movido a PERMITIDOS.`);
    // Avisar al usuario que fue autorizado (opcional pero útil)
    try {
        bot.telegram.sendMessage(chatId, `✅ Hola ${usuarios.usuario}! ahora estás autorizado para usar el bot.`);
    } catch (error) {
        ver(`⚠️ No se pudo enviar mensaje al usuario ${id}: ${error.message}`);
    } return true;
};

// 🚫 Bloquear usuario (mueve de pendientes a bloqueados)
export function bloquearUsuario(chatId) {
    const pendientes = leerJSON(rutaPendientes);
    const bloqueados = leerJSON(rutaBloqueados);

    const usuarios = pendientes.find(u => u.id === chatId);
    if (!usuarios) return false;

    pendientes.splice(pendientes.indexOf(usuarios), 1);
    bloqueados.push(usuarios);

    escribirJSON(rutaPendientes, pendientes);
    escribirJSON(rutaBloqueados, bloqueados);

    ver(`🚫 Usuario ${usuarios.usuarios} (${chatId}) movido a BLOQUEADOS.`);
    return true;
};