const Usuario = require("../models/Usuario");
const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

/**
 * Registra un usuario y emite su token de acceso.
 * @param {import("express").Request} req Solicitud HTTP.
 * @param {import("express").Response} res Respuesta HTTP.
 * @returns {Promise<import("express").Response>} Respuesta de la operación.
 */
exports.crearUsuario = async (req, res) => {
  // Revisar errores
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array().map(({ param, msg }) => ({ param, msg })) });
  }

  // Destructuring de email y password
  const { nombre, email, password } = req.body;

  try {
    //   Revisar que el usuario registrado sea unico
    let usuario = await Usuario.findOne({ email });

    if (usuario) {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }

    // Crear el nuevo usuario
    usuario = new Usuario({ nombre, email });

    // Hashear el password
    const salt = await bcryptjs.genSalt(10);
    usuario.password = await bcryptjs.hash(password, salt);

    // Guardar usuario
    await usuario.save();

    // Crear y firmar el JWT
    const payload = {
      usuario: {
        id: usuario.id
      }
    };

    const token = jwt.sign(payload, process.env.SECRETA, { expiresIn: 3600 });
    return res.json({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Hubo un error" });
  }
};
