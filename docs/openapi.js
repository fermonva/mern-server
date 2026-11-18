const object = (properties, required) => ({ type: 'object', properties, ...(required && { required }) });
const string = { type: 'string' };
const id = { type: 'string', pattern: '^[0-9a-fA-F]{24}$' };
const email = { type: 'string', format: 'email' };
const password = { type: 'string', format: 'password' };
const date = { type: 'string', format: 'date-time' };
const estado = { type: 'boolean' };
const nombreTarea = { type: 'string', minLength: 1, maxLength: 200 };
const proyecto = object({ _id: id, nombre: string, creador: id, creado: date });
const tarea = object({ _id: id, nombre: nombreTarea, estado, proyecto: id, creado: date });
const array = (items) => ({ type: 'array', items });
const json = (schema) => ({ 'application/json': { schema } });
const msg = object({ msg: string }, ['msg']);
const invalid = { anyOf: [msg, object({ errores: array(object({ msg: string })) }, ['errores'])] };
const param = (name, where, description) => ({ name, in: where, required: true, description, schema: id });

function operation(tag, summary, schema, options = {}) {
  const { publicRoute, body, parameters, badRequest, unauthorized, notFound, textError, description } = options;
  return {
    tags: [tag], summary,
    ...(description && { description }),
    ...(publicRoute && { security: [] }),
    ...(parameters && { parameters }),
    ...(body && { requestBody: { required: true, content: json(body) } }),
    responses: {
      200: { description: 'Operación realizada correctamente.', content: json(schema) },
      ...(badRequest && { 400: { description: badRequest, content: json(invalid) } }),
      ...(!publicRoute && { 401: { description: unauthorized || 'Falta el token o no es válido.', content: json(msg) } }),
      ...(notFound && { 404: { description: notFound, content: json(msg) } }),
      500: { description: 'Error interno del servidor.', content: textError ? { 'text/html': { schema: string } } : json(msg) },
    },
  };
}

const token = object({ token: string }, ['token']);
const nombreProyecto = object({ nombre: { type: 'string', minLength: 1 } }, ['nombre']);
const proyectoId = [param('id', 'path', 'Identificador del proyecto.')];
const tareaId = [param('id', 'path', 'Identificador de la tarea.')];
const sinAcceso = 'Falta el token, no es válido o el proyecto no te pertenece.';
const tareaNoEncontrada = 'La tarea no existe o no tenés acceso a ella.';

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de proyectos y tareas', version: require('../package.json').version,
    description: 'Registrá una cuenta o iniciá sesión para obtener un JWT. Usá el token sin el prefijo Bearer en las operaciones protegidas.',
  },
  servers: [{ url: '/' }],
  security: [{ token: [] }],
  components: { securitySchemes: { token: { type: 'apiKey', in: 'header', name: 'x-auth-token' } } },
  paths: {
    '/api/usuarios': {
      post: operation('Usuarios', 'Registrar una cuenta', token, {
        publicRoute: true,
        body: object({ nombre: { type: 'string', minLength: 1 }, email, password: { ...password, minLength: 6 } }, ['nombre', 'email', 'password']),
        badRequest: 'Datos inválidos o el usuario ya existe.',
      }),
    },
    '/api/auth': {
      post: operation('Autenticación', 'Iniciar sesión', token, {
        publicRoute: true, body: object({ email, password: { ...password, minLength: 1 } }, ['email', 'password']),
        badRequest: 'Datos o credenciales inválidos.',
      }),
      get: operation('Autenticación', 'Consultar el perfil autenticado', object({
        usuario: { ...object({ _id: id, nombre: string, email, registro: date }), nullable: true },
      })),
    },
    '/api/proyectos': {
      get: operation('Proyectos', 'Listar tus proyectos', object({ proyectos: array(proyecto) }), { textError: true }),
      post: operation('Proyectos', 'Crear un proyecto', proyecto, {
        body: nombreProyecto, badRequest: 'El nombre es obligatorio.', textError: true,
      }),
    },
    '/api/proyectos/{id}': {
      put: operation('Proyectos', 'Actualizar el nombre de un proyecto', object({ proyecto }), {
        parameters: proyectoId, body: nombreProyecto, badRequest: 'Datos inválidos o proyecto no encontrado.',
        unauthorized: sinAcceso, textError: true,
      }),
      delete: operation('Proyectos', 'Eliminar un proyecto', msg, {
        parameters: proyectoId, badRequest: 'Proyecto no encontrado.', unauthorized: sinAcceso, textError: true,
      }),
    },
    '/api/tareas': {
      get: operation('Tareas', 'Listar las tareas de un proyecto propio', object({ tareas: array(tarea) }), {
        parameters: [param('proyecto', 'query', 'Identificador del proyecto.')],
        badRequest: 'Identificador inválido o proyecto no encontrado.', unauthorized: sinAcceso, textError: true,
      }),
      post: operation('Tareas', 'Crear una tarea en un proyecto propio', object({ tarea }), {
        body: object({ nombre: nombreTarea, proyecto: id, estado: { ...estado, default: false } }, ['nombre', 'proyecto']),
        badRequest: 'Datos inválidos o proyecto no encontrado.', unauthorized: sinAcceso, textError: true,
      }),
    },
    '/api/tareas/{id}': {
      put: operation('Tareas', 'Actualizar una tarea', object({ tarea }), {
        description: 'Enviá el nombre, el estado o ambos. No podés cambiar el proyecto de la tarea.',
        parameters: tareaId,
        body: { ...object({ nombre: nombreTarea, estado }), anyOf: [{ required: ['nombre'] }, { required: ['estado'] }] },
        badRequest: 'Datos inválidos o no se indicó ningún cambio.', notFound: tareaNoEncontrada,
      }),
      delete: operation('Tareas', 'Eliminar una tarea', msg, {
        parameters: tareaId, badRequest: 'Identificador de tarea inválido.', notFound: tareaNoEncontrada,
      }),
    },
  },
};
