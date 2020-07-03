const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Leer el token del header
  const token = req.header("x-auth-token");

  // Revisar si hay token
  if (!token) {
    return res
      .status(401)
      .json({ msg: "No hay permisos validos por el token" });
  }

  // Validar el token
    try {
        const cifrado = jwt.verify(token, process.env.SECRETA);
        req.usuario = cifrado.usuario;
        next();
  } catch (error) {
    res.status(401).json({ msg: "Token no válido" });
  }
};
