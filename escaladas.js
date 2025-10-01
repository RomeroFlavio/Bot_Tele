import mongoose from "mongoose";

const resolvedSchema = new mongoose.Schema({
    order: {
        type: Object,
        required: true,
        trim: true
    },
    climb: {
        type: Object,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true,
        trim: true
    },
    descrip: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        required: true,
        trim: true
    }
});

export const respuestasEs = mongoose.model('ordenesescaladas', resolvedSchema);

// Obtener todos los documentos Utilizando forEach()
export const obtenerEscaladas = async () => {
    try {
        const documentos = await respuestasEs.find();
        if (documentos.length > 0) {
            const datos = documentos.map((documento) => ({
                chatId: documento.order.chatId,
                tecnico: documento.order.tecnico,
                numeroCliente: documento.order.numeroCliente,
                tipoOrden: documento.order.tipoOrden,
                msjOp: documento.climb.description,
                idObjeto: documento.id,
                status: documento.status,
            }));
            return datos;
        } else {
            return []; // Retorna un arreglo vacío si no hay documentos
        }
    } catch (error) {
        console.error(error);
        return []; // Si ocurre un error, también retorna un arreglo vacío
    }
};
// obtenerEscaladas();

// Obtener un documento específico
export const obtenerUno = async () => {
    try {
        const documento = await respuestas.findById('id-del-documento');
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
export const actualizarEscalada = async (id) => {
    try {
        const documento = await respuestas.findById(id);
        console.log(documento)
        if (documento) {
            if (documento.status === false) {
                await respuestas.findByIdAndUpdate(id, {
                    $set: { status: true },
                });
                console.log(`Documento ${id} actualizado`);
            } else {
                console.log(`Documento ${id} ya está actualizado`);
            }
        } else {
            console.log(`Documento ${id} no encontrado`);
        }
    } catch (error) {
        console.error(error);
    }
};
//actualizarEstatus();

// Eliminar un documento
const eliminarDocumento = async () => {
    try {
        await respuestas.findByIdAndDelete('id-del-documento');
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