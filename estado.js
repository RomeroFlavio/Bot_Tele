import mongoose from 'mongoose';
import { respuestasRes } from './resueltos.js';
import { respuestasEs } from './escaladas.js';



// Definimos los esquemas para las tres colecciones
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

const clienteSchema = new mongoose.Schema({
    numeroCliente: String,
    // Otros campos relevantes del cliente
});

// Verificar si el modelo ya existe antes de definirlo
export const respuestasPen = mongoose.model('clientespendientes', resolvedSchema);

// Función para buscar en las tres colecciones
export const buscarClienteEnColecciones = async (numeroCliente) => {
    try {
      // Buscar en la colección de ordenes resueltas
      const resultadoResueltas = await respuestasRes.findOne({ 'order.numeroCliente': numeroCliente });
      if (resultadoResueltas) {
        return { mensaje: `Cliente ${numeroCliente} encontrado en Ordenes Resueltas`, coleccion: 'ordenesresueltas' };
      }
  
      // Buscar en la colección de ordenes escaladas
      const resultadoEscaladas = await respuestasEs.findOne({ 'order.numeroCliente': numeroCliente });
      if (resultadoEscaladas) {
        return { mensaje: `Cliente ${numeroCliente} encontrado en Ordenes Escaladas`, coleccion: 'ordenesescaladas' };
      }
  
      // Buscar en la colección de clientes pendientes
      const resultadoPendientes = await respuestasPen.findOne({ numeroCliente });
      if (resultadoPendientes) {
        return { mensaje: `Cliente ${numeroCliente} encontrado en Clientes Pendientes`, coleccion: 'clientespendientes' };
      }
  
      // Si no se encuentra en ninguna de las colecciones
      return { mensaje: `Cliente ${numeroCliente} no encontrado en ninguna colección` };
    } catch (error) {
      console.error(error);
      return { mensaje: 'Error al buscar el cliente' };
    }
  };