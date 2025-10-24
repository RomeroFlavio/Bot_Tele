import mongoose from "mongoose";

const resolvedSchema = new mongoose.Schema({
    numeroCliente: { type: String, required: true, trim: true },
    chatId: { type: String, required: true, trim: true },
    tecnico: { type: String, required: true, trim: true },
    tipoOrden: { type: String, required: true, trim: true },
    macInstaladaSM: { type: String, trim: true },
    macInstaladaRouter: { type: String, trim: true },
    ipAp: { type: String, trim: true },
    nodo: { type: String, trim: true },
    datoAdicional: { type: String, trim: true },
    costo: { type: String, trim: true },
    agent: { type: String, trim: true },
    fotos: { type: Array, default: [] },
    climb: { type: Object, default: {} },
    status: { type: Boolean, required: true, trim: true },
}, { timestamps: true }); // incluye createdAt y updatedAt automáticos

export const respuestasEs = mongoose.model('ordenesescaladas', resolvedSchema);

// Obtener todos los documentos Utilizando forEach()
export const obtenerEscaladas = async () => {
    try {
        const documentos = await respuestasEs.find();
        if (documentos.length > 0) {
            const datos = documentos.map((documento) => ({
                chatId: documento.chatId,               // ✅ ahora directo
                tecnico: documento.tecnico,
                numeroCliente: documento.numeroCliente,
                tipoOrden: documento.tipoOrden,
                msjOp: documento.climb?.description || "Sin descripción",
                idObjeto: documento._id.toString(),
                status: documento.status,
            }));

            return datos;
        } else {
            return []; // Retorna un arreglo vacío si no hay documentos
        }
    } catch (error) {
        console.error("Error en obtenerEscaladas:", error);
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
        const documento = await respuestasEs.findById(id);
        //console.log(documento)
        if (documento) {
            if (documento.status === false) {
                await respuestasEs.findByIdAndUpdate(id, {
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

//Mover entre colecciones
export const moverEscaladaAClientesPendientes = async (id) => {
    try {
      if (!id) throw new Error('Se requiere un id');
  
      const objectId = mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : null;
      if (!objectId) throw new Error('id inválido');
  
      // Buscar el documento en ordenesescaladas
      const documento = await respuestasEs.findById(objectId).lean();
      if (!documento) {
        return { ok: false, error: 'Documento no encontrado' };
      }
  
      // Cambiar el status a false antes de moverlo
      documento.status = false;
  
      // Insertar el documento en la colección clientespendientes
      const targetCollection = mongoose.connection.collection('clientespendientes');
      const insertResult = await targetCollection.insertOne(documento);
  
      // Si se insertó correctamente, eliminar el original
      if (insertResult.insertedId) {
        await respuestasEs.findByIdAndDelete(objectId);
        console.log(`✅ Documento ${id} movido a clientespendientes con status=false`);
        return { ok: true, movedId: insertResult.insertedId };
      } else {
        return { ok: false, error: 'No se pudo insertar en clientespendientes' };
      }
    } catch (error) {
      console.error('Error moverEscaladaAClientesPendientes:', error);
      return { ok: false, error: error.message || error };
    }
  };
  