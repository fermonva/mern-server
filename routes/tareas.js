const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { crearTarea, obtenerTareas, actualizarTarea, eliminarTarea } = require('../controllers/tareaController');
const auth = require('../middleware/auth');

const router = Router();
const validarNombre = () => body('nombre', 'Ingresá un nombre de 1 a 200 caracteres')
  .isString().bail().trim().isLength({ min: 1, max: 200 });
const validarEstado = () => body('estado', 'El estado debe ser booleano')
  .optional().custom((estado) => typeof estado === 'boolean');
const validarId = () => param('id', 'ID de tarea inválido').isMongoId();

router.post('/', auth, [
  validarNombre(),
  validarEstado(),
  body('proyecto', 'ID de proyecto inválido').isString().bail().isMongoId(),
], crearTarea);
router.get('/', auth, [
  query('proyecto', 'ID de proyecto inválido').isString().bail().isMongoId(),
], obtenerTareas);
router.put('/:id', auth, [validarId(), validarNombre().optional(), validarEstado()], actualizarTarea);
router.delete('/:id', auth, validarId(), eliminarTarea);

module.exports = router;
