// Rutas para autenticar usuarios
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/', [
  body('email', 'Ingresá un correo válido').isString().bail().trim().isEmail(),
  body('password', 'Ingresá una contraseña válida').isString().bail().notEmpty(),
], authController.autenticarUsuario);

router.get('/', auth, authController.usuarioAutenticado);
module.exports = router;
