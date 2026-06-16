# formulario-academico

Aplicacion web universitaria para registrar evaluaciones academicas al finalizar una clase. El proyecto esta organizado como monorepo monolitico con dos workspaces:

- `front`: React + Vite + TypeScript + Tailwind CSS.
- `back`: Node.js + Express + TypeScript + PostgreSQL.

## Arquitectura

El backend usa una arquitectura por modulos: `auth`, `users` y `evaluations`. La API valida entradas con Zod, autentica con Google OAuth mediante ID token, emite JWT propio y persiste usuarios/evaluaciones en PostgreSQL. La conexion usa `DATABASE_URL`, compatible con PostgreSQL local y Google Cloud SQL.

El frontend implementa login con Google, formulario multi-step responsive, validaciones de campos, calificaciones 1-5, pantalla final de confirmacion y una vista administrativa con analitica protegida por rol.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker, opcional pero recomendado para PostgreSQL local.
- Un OAuth Client ID de Google configurado para `http://localhost:5173`.

En Windows PowerShell, si `npm` esta bloqueado por politicas de ejecucion, usa `npm.cmd`.

## Variables de entorno

Copia los ejemplos:

```bash
cp .env.example back/.env
cp front/.env.example front/.env
```

Configura al menos:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/formulario_academico
GOOGLE_CLIENT_ID=tu-client-id-google
ADMIN_EMAILS=admin@universidad.edu.co,coordinador@universidad.edu.co
JWT_SECRET=un-secreto-largo-y-seguro
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
PORT=3000
```

En `front/.env`:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id-google
VITE_BACKEND_URL=http://localhost:3000
```

## Ejecucion local

Instala dependencias:

```bash
npm install
```

Levanta PostgreSQL:

```bash
docker compose up -d postgres
```

Ejecuta migraciones:

```bash
npm run db:migrate
```

Inicia frontend y backend:

```bash
npm run dev
```

URLs locales:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

## Scripts

```bash
npm run dev        # front y back en modo desarrollo
npm run build      # compila ambos workspaces
npm run start      # inicia el backend compilado
npm run db:migrate # aplica migraciones SQL
npm run lint       # type-check en ambos proyectos
```

## API

Endpoints principales:

- `POST /auth/google`: recibe `{ "credential": "GOOGLE_ID_TOKEN" }` y devuelve `{ token, user }`.
- `GET /me`: devuelve el usuario autenticado.
- `POST /evaluaciones`: crea una evaluacion academica.
- `GET /evaluaciones`: lista evaluaciones del usuario autenticado.
- `GET /evaluaciones/:id`: obtiene una evaluacion del usuario autenticado.
- `GET /evaluaciones/admin/dashboard`: panel global para usuarios con rol `admin`.
- `GET /health`: verifica estado de la API.

Todas las rutas excepto `/auth/google` y `/health` requieren:

```http
Authorization: Bearer JWT
```

## Base de datos

La migracion inicial crea:

- `users`
- `evaluations`
- `schema_migrations`

Los metadatos `submitted_at`, `ip_address`, `user_agent`, usuario autenticado y correo Google se registran desde el backend.

## Docker

Construir backend:

```bash
docker build -f back/Dockerfile -t formulario-academico-back .
```

Construir frontend:

```bash
docker build -f front/Dockerfile -t formulario-academico-front ^
  --build-arg VITE_GOOGLE_CLIENT_ID=tu-client-id-google ^
  --build-arg VITE_BACKEND_URL=http://localhost:3000 .
```

En macOS/Linux cambia `^` por `\`.

## Despliegue en Google Cloud Run

1. Crea una instancia PostgreSQL en Cloud SQL.
2. Crea la base de datos, usuario y password.
3. Habilita Artifact Registry y Cloud Run.
4. Construye y sube las imagenes:

```bash
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/formulario-academico/backend:latest -f back/Dockerfile .
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/formulario-academico/frontend:latest -f front/Dockerfile .
```

5. Despliega el backend con conexion a Cloud SQL:

```bash
gcloud run deploy formulario-academico-api \
  --image REGION-docker.pkg.dev/PROJECT_ID/formulario-academico/backend:latest \
  --region REGION \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
  --set-env-vars NODE_ENV=production,PORT=3000,FRONTEND_URL=https://TU_FRONTEND,BACKEND_URL=https://TU_BACKEND,GOOGLE_CLIENT_ID=TU_CLIENT_ID \
  --set-secrets JWT_SECRET=JWT_SECRET:latest,DATABASE_URL=DATABASE_URL:latest
```

6. Ejecuta migraciones contra Cloud SQL desde un entorno con acceso a la instancia:

```bash
npm run db:migrate -w back
```

7. Construye el frontend con `VITE_BACKEND_URL` apuntando al backend desplegado y despliega Cloud Run.

Los manifiestos `gcp/backend-service.yaml` y `gcp/frontend-service.yaml` sirven como punto de partida para infraestructura declarativa.

## Seguridad basica incluida

- Validacion de datos con Zod en backend.
- Validaciones de UX en frontend.
- JWT con expiracion.
- Helmet.
- Rate limiting.
- CORS restringido por `FRONTEND_URL`.
- Sin secretos hardcodeados.
- Preparado para Secret Manager en despliegue.

## Notas academicas

Los usuarios cuyo correo aparezca en `ADMIN_EMAILS` reciben rol `admin`; los demas reciben rol `student`. Un estudiante solo puede diligenciar el formulario y no ve el panel administrativo. Cada estudiante puede enviar una sola evaluacion por materia y profesor en una misma fecha. El panel administrativo muestra resultados globales, rankings de profesores, estadisticas por materia y comentarios recientes.
