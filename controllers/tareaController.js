const Tarea = require('../models/Tarea');
const Proyecto = require('../models/Proyecto');
const { validationResult } = require('express-validator');

/**
 * Crea una tarea en un proyecto propio.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.crearTarea = async (req, res) => {
  // Revisar errores
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      errores: errores.array(),
    });
  }

  // Extraer el proyecto y comprobar si existe
  const { proyecto, nombre, estado } = req.body;

  try {
    const existeProyecto = await Proyecto.findById(proyecto);
    if (!existeProyecto) {
      return res.status(400).json({ msg: 'Proyecto no encontrado' });
    }

    // Revisar si el proyecto es del usuario en sesion
    if (existeProyecto.creador.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    const tarea = new Tarea({ proyecto, nombre, estado });
    await tarea.save();
    return res.json({ tarea });
  } catch (error) {
    console.log(error);
    return res.status(500).send('Hubo un error');
  }
};

/**
 * Lista las tareas de un proyecto propio.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.obtenerTareas = async (req, res) => {
  // Extraer el proyecto y comprobar si existe
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { proyecto } = req.query;

  try {
    const existeProyecto = await Proyecto.findById(proyecto);
    if (!existeProyecto) {
      return res.status(400).json({ msg: 'Proyecto no encontrado' });
    }

    // Revisar si el proyecto es del usuario en sesion
    if (existeProyecto.creador.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    // Obtener las tareas por proyecto
    const tareas = await Tarea.find({ proyecto }).sort({ creado: -1 });
    return res.json({ tareas });
  } catch (error) {
    console.log(error);
    return res.status(500).send('Hubo un error');
  }
};

/**
 * Devuelve el filtro de una tarea cuyo proyecto pertenece al usuario autenticado.
 * El proyecto se obtiene de la tarea, nunca de los datos enviados por el cliente.
 * @param {string} id Identificador de la tarea.
 * @param {string} usuarioId Identificador del usuario autenticado.
 * @returns {Promise<object|null>} Filtro autorizado o null si no hay acceso.
 */
async function obtenerFiltroAutorizado(id, usuarioId) {
  const tarea = await Tarea.findById(id).select('proyecto');
  if (!tarea?.proyecto) return null;

  const proyecto = await Proyecto.exists({ _id: tarea.proyecto, creador: usuarioId });
  return proyecto ? { _id: id, proyecto: tarea.proyecto } : null;
}

/**
 * Actualiza los campos permitidos de una tarea propia.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.actualizarTarea = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { nombre, estado } = req.body;
  const cambios = {};
  if (nombre !== undefined) cambios.nombre = nombre;
  if (estado !== undefined) cambios.estado = estado;
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ msg: 'Indicá el nombre o el estado de la tarea' });
  }

  try {
    const filtro = await obtenerFiltroAutorizado(req.params.id, req.usuario.id);
    const tarea = filtro && await Tarea.findOneAndUpdate(
      filtro, { $set: cambios }, { new: true, runValidators: true }
    );
    if (!tarea) return res.status(404).json({ msg: 'No existe la tarea' });
    return res.json({ tarea });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Hubo un error' });
  }
};

/**
 * Elimina una tarea propia sin revelar tareas ajenas.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.eliminarTarea = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const filtro = await obtenerFiltroAutorizado(req.params.id, req.usuario.id);
    const tarea = filtro && await Tarea.findOneAndDelete(filtro);
    if (!tarea) return res.status(404).json({ msg: 'No existe la tarea' });
    return res.json({ msg: 'Tarea eliminada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Hubo un error' });
  }
};
