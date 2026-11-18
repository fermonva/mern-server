# MERN Server — API de proyectos y tareas

Backend REST para registrar usuarios, iniciar sesión y organizar tareas por proyecto. Está hecho con **Node.js y Express**, guarda los datos en **MongoDB** mediante Mongoose y usa **JWT** para autenticar las solicitudes. Este repositorio contiene solo el servidor, no la interfaz web.

## Puesta en marcha

Necesitás **Node.js 22 o superior**, **pnpm 12.21.0** y una instancia activa de **MongoDB** (local o en Atlas).

1. Desde la raíz del proyecto, instalá las dependencias y creá tu archivo de configuración si todavía no existe:

   ```bash
   pnpm install --frozen-lockfile
   test -f variables.env || cp variables.env.example variables.env
   ```

2. Editá `variables.env` con los valores de tu entorno:

   | Variable | Qué configurar |
   | --- | --- |
   | `DB_MONGO` | URI de MongoDB. Si tenés MongoDB local, podés usar `mongodb://127.0.0.1:27017/merntask`. En Atlas, copiá la URI desde **Connect → Drivers** y completá las credenciales del usuario de la base. |
   | `SECRETA` | Clave privada que se usa para firmar los tokens JWT. Debe ser aleatoria y no puede quedar vacía. Podés generar una con `openssl rand -hex 32`. |
   | `PORT` | Puerto HTTP del servidor. Si no lo definís, usa `4000`. |

   No subas `variables.env` ni compartas sus valores. Usá [`variables.env.example`](variables.env.example) como plantilla sin credenciales.

3. Iniciá el servidor desde la raíz:

   ```bash
   pnpm dev
   ```

   La API usa `http://localhost:4000` por defecto. `pnpm dev` reinicia el proceso al detectar cambios en el código; `pnpm start` lo ejecuta sin ese modo.

## Cómo usar la API

Registrá una cuenta o iniciá sesión para obtener un token. En las rutas protegidas, envialo en la cabecera `x-auth-token`. Para solicitudes con cuerpo JSON, usá `Content-Type: application/json`.

| Método y ruta | Para qué sirve | ¿Requiere token? |
| --- | --- | --- |
| `POST /api/usuarios` | Registrar una cuenta (`nombre`, `email`, `password`). | No |
| `POST /api/auth` | Iniciar sesión (`email`, `password`). | No |
| `GET /api/auth` | Consultar el perfil autenticado. | Sí |
| `GET /api/proyectos` | Listar tus proyectos. | Sí |
| `POST /api/proyectos` | Crear un proyecto (`nombre`). | Sí |
| `PUT /api/proyectos/:id`, `DELETE /api/proyectos/:id` | Actualizar o eliminar un proyecto. | Sí |
| `GET /api/tareas?proyecto=<id>` | Listar las tareas de un proyecto. | Sí |
| `POST /api/tareas` | Crear una tarea (`nombre`, `proyecto`). | Sí |
| `PUT /api/tareas/:id`, `DELETE /api/tareas/:id` | Actualizar o eliminar una tarea. | Sí |

## Si MongoDB no conecta

- **Local:** verificá que MongoDB esté en ejecución y que `DB_MONGO` apunte al puerto correcto.
- **Atlas — `querySrv ENOTFOUND`:** verificá que el clúster esté activo y que el nombre del host coincida con el de la URI actual de Atlas.
- **Atlas — rechazo de conexión o autenticación:** revisá el usuario de la base, sus permisos y que Atlas permita conexiones desde tu IP.

Reiniciá el servidor después de editar `variables.env`. El mensaje de inicio en el puerto no confirma por sí solo que MongoDB esté conectado.
