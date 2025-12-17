# UniPlanner

Plataforma academica para planificacion de estudio. Incluye un backend
en Flask con PostgreSQL y una app movil en Expo (React Native).

## Funcionalidades principales

- Autenticacion con JWT (registro, login y restablecer contrasena).
- Gestion de cursos, materias actuales y materias aprobadas.
- Gestion de tareas con progreso, dificultad y horas estimadas.
- Recomendaciones inteligentes y estadisticas de estudio.
- Calendario institucional con eventos academicos.
- Notificaciones y logros (si el modulo esta disponible).

## Tecnologias

Backend:
- Python + Flask
- PostgreSQL
- JWT (PyJWT)
- Validaciones y logging profesional

Frontend:
- Expo (React Native)
- Axios + SecureStore

## Estructura del proyecto

```
BDUniPlanner/          # Backend Flask + base de datos
UniplannerApp/         # App movil (Expo)
logs/                  # Logs del sistema (si se habilitan)
ejem.py                # Ejemplo de usuario y tareas
```

## Requisitos

- Python 3.10+ (recomendado)
- Node.js 18+ (recomendado)
- PostgreSQL 13+

## Backend (BDUniPlanner)

### Instalacion

```bash
cd BDUniPlanner
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de entorno

Crea un archivo `BDUniPlanner/.env` con valores similares:

```
DATABASE_URL=postgres://usuario:password@localhost:5432/uniplanner
SECRET_KEY=tu_clave_secreta
FLASK_ENV=development
CORS_ORIGINS=*
LOG_LEVEL=INFO
```

### Inicializar base de datos

```bash
cd BDUniPlanner
python init_db.py
```

Esto crea tablas y carga pensum + calendario academico.

### Ejecutar la API

```bash
cd BDUniPlanner
python flask_api.py
```

Por defecto corre en `http://localhost:5000`.

### Resetear la base de datos (opcional)

```bash
cd BDUniPlanner
python deleterBD.py
```

Advertencia: esto elimina el esquema `public` completo.

## Frontend (UniplannerApp)

### Instalacion

```bash
cd UniplannerApp
npm install
```

### Configurar URL de la API

Edita `UniplannerApp/src/api/client.js` y ajusta `API_URL`:

```js
const API_URL = 'http://TU_IP:5000/api/';
```

### Ejecutar la app

```bash
cd UniplannerApp
npx expo start
```

## Endpoints principales (API)

- Salud: `GET /api/health`
- Auth: `POST /api/auth/registro`, `POST /api/auth/login`, `POST /api/auth/restablecer`
- Cursos: `GET /api/cursos`, `GET /api/cursos/<codigo>`, `GET /api/cursos/buscar?q=...`
- Usuario: `GET /api/usuario/perfil`
- Materias: `GET /api/usuario/materias/actuales`, `GET /api/usuario/materias/aprobadas`,
  `POST /api/usuario/materias/inscribir`, `POST /api/usuario/materias/cancelar`
- Tareas: `GET /api/tareas`, `POST /api/tareas`, `DELETE /api/tareas/<id>`,
  `POST /api/tareas/<id>/completar`, `POST /api/tareas/<id>/progreso`
- Recomendaciones: `GET /api/recomendaciones`, `GET /api/recomendaciones/tareas-urgentes`,
  `GET /api/recomendaciones/plan-estudio`, `GET /api/recomendaciones/carga-semanal`
- Estadisticas: `GET /api/estadisticas`, `GET /api/estadisticas/detalladas`
- Calendario: `GET /api/calendario/eventos`
- Notificaciones: `GET /api/notificaciones`, `POST /api/notificaciones/<id>/marcar-leida`,
  `GET /api/notificaciones/no-leidas/contar`
- Logros: `GET /api/logros`

## Ejemplo de datos

El archivo `ejem.py` genera un usuario de ejemplo con muchas tareas.
Puedes usarlo como referencia para construir payloads de registro o
para pruebas locales.

```bash
python ejem.py
```

## Notas

- Los logs se guardan en `logs/` cuando el logger esta activo.
- Si usas Render u otro proveedor, revisa `Procfile` y `DATABASE_URL`.

