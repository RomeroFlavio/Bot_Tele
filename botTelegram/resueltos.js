import mongoose from "mongoose";
import { ver } from './bot.js';

const resolvedSchema = new mongoose.Schema({
    order: {
        type: Object,
        required: true,
        trim: true
    },
    ticket: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true,
        trim: true
    },
    resolved: {
        ticket: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true }
    },
    status: {
        type: Boolean,
        required: true,
        trim: true
    },
    climb: {
        type: Object,
        required: false,
        trim: true
    }
});

export const respuestasRes = mongoose.model('ordenesResueltas', resolvedSchema);

// Obtener todos los documentos Utilizando forEach()
export const obtenerTodos = async () => {
    try {
        const documentos = await respuestasRes.find();
        if (documentos.length > 0) {
            return documentos.map(doc => ({
                order: doc.order,
                chatId: doc.order.chatId,
                tecnico: doc.order.tecnico,
                numeroCliente: doc.order.numeroCliente,
                tipoOrden: doc.order.tipoOrden,
                resolved: doc.resolved,
                ticket: doc.resolved.ticket,
                description: doc.resolved.description,
                idObjeto: doc._id,
                status: doc.status,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error al obtener todos los documentos:", error);
        return [];
    }
};
// obtenerTodos();

// Obtener un documento específico
export const obtenerUno = async () => {
    try {
        const documento = await respuestasRes.findById('id-del-documento');
        console.log(documento);
    } catch (error) {
        console.error(error);
    }
};
// obtenerUno();

// Agregar un nuevo documento
export const agregarDocumento = async () => {
    try {
        const nuevoDocumento = new respuestas({
            order: {},
            ticket: 'nuevo-ticket',
            description: 'nueva-descripción',
            date: 'nueva-fecha'
        });
        await nuevoDocumento.save();
        console.log('Documento agregado');
    } catch (error) {
        console.error(error);
    }
};
//agregarDocumento();

// Actualizar un documento
export const actualizarEstatus = async (id) => {
    try {
        const documento = await respuestasRes.findById(id);
        if (!documento) {
            console.log(`Documento ${id} no encontrado`);
            return;
        }

        if (documento.status === false) {
            await respuestasRes.findByIdAndUpdate(id, { $set: { "status": true } });
            console.log(`Documento ${id} actualizado`);
        } else {
            console.log(`Documento ${id} ya está actualizado`);
        }
    } catch (error) {
        console.error(`Error al actualizar el documento ${id}:`, error);
    }
};
//actualizarEstatus();

// Eliminar un documento
const eliminarDocumento = async () => {
    try {
        await respuestasRes.findByIdAndDelete('id-del-documento');
        console.log('Documento eliminado');
    } catch (error) {
        console.error(error);
    }
};
//eliminarDocumento();

//actualizacion automatica
export const ActualizacionAutomatica = async (funcion, intervalo = 60000) => {
    setInterval(async () => {
        const datos = await funcion();
        console.log(datos);
    }, intervalo);
};
//ActualizacionAutomatica(parametro a actualizar)
//ejemplo: ActualizacionAutomatica(obtenerTodos, 30000); cada 30 segundos