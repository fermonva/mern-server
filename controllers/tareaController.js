const Tarea = require('../models/Tarea');
const Proyecto = require('../models/Proyecto');
const { validationResult } = require('express-validator');

// Crea una nueva tarea
exports.crearTarea = async (req, res) => {
  // Revisar errores
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      errores: errores.array(),
    });
  }

  // Extraer el proyecto y comprobar si existe
  const { proyecto } = req.body;

  try {
    const existeProyecto = await Proyecto.findById(proyecto);
    if (!existeProyecto) {
      return res.status(400).json({ msg: 'Proyecto no encontrado' });
    }

    // Revisar si el proyecto es del usuario en sesion
    if (existeProyecto.creador.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    const tarea = new Tarea(req.body);
    await tarea.save();
    res.json({ tarea });
  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error');
  }
};

// Tareas por proyecto
exports.obtenerTareas = async (req, res) => {
  // Extraer el proyecto y comprobar si existe
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
    res.json({ tareas });
  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error');
  }
};

// Actualizar tarea
exports.actualizarTarea = async (req, res) => {
  try {
    // Extraer el proyecto y comprobar si existe
    const { proyecto, nombre, estado } = req.body;

    // Verificar si la tarea existe o no
    let tarea = await Tarea.findById(req.params.id);
    if (!tarea) {
      return res.status(404).json({
        msg: 'No existe la tarea',
      });
    }

    // Extraer el proyecto
    const existeProyecto = await Proyecto.findById(proyecto);

    // Revisar si el proyecto es del usuario en sesion
    if (existeProyecto.creador.toString() !== req.usuario.id) {
      return res.status(401).json({
        msg: 'No autorizado',
      });
    }

    // Crear objeto con la nueva información
    const nuevaTarea = {};

    nuevaTarea.nombre = nombre;
    nuevaTarea.estado = estado;

    // Guardar la tarea
    tarea = await Tarea.findByIdAndUpdate({ _id: req.params.id }, nuevaTarea, {
      new: true,
    });
    res.json({ tarea });
  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error');
  }
};

// Eliminar una tarea
exports.eliminarTarea = async (req, res) => {
  try {
    // Extraer el proyecto y comprobar si existe
    const { proyecto } = req.query;

    // Verificar si la tarea existe o no
    let tarea = await Tarea.findById(req.params.id);
    if (!tarea) {
      return res.status(404).json({
        msg: 'No existe la tarea',
      });
    }

    // Extraer el proyecto
    const existeProyecto = await Proyecto.findById(proyecto);

    // Revisar si el proyecto es del usuario en sesion
    if (existeProyecto.creador.toString() !== req.usuario.id) {
      res.status(401).json({
        msg: 'No autorizado',
      });
    }

    // Eliminar tarea
    await Tarea.findOneAndRemove({ _id: req.params.id });
    res.json({ msg: 'Tarea eliminada' });
  } catch (error) {
    console.log(error);
    res.status(500).send('Hubo un error');
  }
};
