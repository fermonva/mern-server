const Usuario = require('../models/Usuario');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

/**
 * Valida las credenciales y emite un token para el usuario.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.autenticarUsuario = async (req, res) => {
  // Revisar errores
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      errores: errores.array().map(({ param, msg }) => ({ param, msg })),
    });
  }

  // Extraer el email y password
  const { email, password } = req.body;

  try {
    // Revisar que sea un usuario registrado
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Validar password
    const passCorrecto = await bcryptjs.compare(password, usuario.password);
    if (!passCorrecto) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Si todo es correcto Crear y firmar el JWT
    const payload = {
      usuario: {
        id: usuario.id,
      },
    };

    const token = jwt.sign(payload, process.env.SECRETA, { expiresIn: 3600 });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Hubo un error' });
  }
};

/**
 * Devuelve el perfil autenticado sin el hash de la contraseña.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.usuarioAutenticado = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    return res.json({ usuario });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: 'Hubo un error' });
  }
};
