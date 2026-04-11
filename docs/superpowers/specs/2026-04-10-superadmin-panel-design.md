# Panel de Superadmin — Diseño

**Fecha:** 2026-04-10  
**Estado:** Aprobado

---

## Resumen

Agregar un panel de administrador de plataforma ("god mode") independiente del flujo normal de los consultorios. El superadmin puede ver y editar todos los recursos del sistema (Tenants, Usuarios, Pacientes, Citas, Pagos) en vistas globales planas con filtros de búsqueda. Se crea automáticamente al arrancar el servidor mediante un seed idempotente.

---

## Arquitectura

### Separación de entidades

El superadmin **no es un usuario de tenant**. Se almacena en una colección separada (`superadmins`), lo que evita contaminar el modelo `User` (que es tenant-scoped) con un usuario sin `tenantId`. Las guards del backend son explícitas y no afectan los endpoints existentes.

### Flujo de login

1. `POST /api/auth/login` busca en `users` por email.
2. Si encuentra un user (activo o no) → sigue el flujo normal (401 si inactivo o password inválido). No busca en `superadmins`. Esto evita colisiones de email entre colecciones.
3. Si **no encuentra ningún user** con ese email → busca en `superadmins`.
4. Si existe y el password es válido, firma un JWT con `{ userId, tenantId: null, rol: "superadmin" }`.
5. El frontend detecta `rol === "superadmin"` y redirige a `/admin`.

---

## Backend

### Nuevo modelo: `server/models/SuperAdmin.ts`

```ts
interface ISuperAdmin {
  nombre: string
  email: string       // único globalmente
  passwordHash: string
  createdAt: Date
}
```

Índice único sobre `email`.

### Seed en startup: `ensureSuperAdmin()`

Llamada en `server/index.ts` después de `connectDB()`. Crea el superadmin si no existe. Si ya existe, **no sobreescribe el password** (permite cambiarlo manualmente en producción sin que el siguiente deploy lo revierta).

Variables de entorno (opcionales, con defaults de desarrollo):

| Variable | Default |
|---|---|
| `SUPERADMIN_EMAIL` | `admin@psicogestion.com` |
| `SUPERADMIN_PASSWORD` | `Admin1234!` |

### Cambios en `shared/types.ts`

```ts
export interface AuthPayload {
  userId: string
  tenantId: string | null   // null para superadmin
  rol: "admin" | "doctor" | "superadmin"
}
```

### Cambios en `server/middleware/auth.ts`

Agregar `requireSuperAdmin`: verifica `req.user.rol === "superadmin"`.

### Rutas nuevas: `server/routes/admin.ts`

Todas protegidas con `authenticate + requireSuperAdmin`. Registradas en `app.ts` como `/api/admin`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/tenants` | Lista todos los tenants. Filtros: `name`, `slug`, `plan`. |
| `GET` | `/api/admin/users` | Lista todos los users cross-tenant. Filtros: `nombre`, `email`, `rol`, `tenantId`, `activo`. |
| `PATCH` | `/api/admin/users/:id` | Editar user: `nombre`, `email`, `rol`, `activo`, `passwordHash` (opcional). |
| `GET` | `/api/admin/pacientes` | Lista global de pacientes. Filtros: `nombre`, `apellido`, `estado`, `tenantId`. |
| `PATCH` | `/api/admin/pacientes/:id` | Editar paciente. |
| `GET` | `/api/admin/citas` | Lista global de citas. Filtros: `fecha`, `estado`, `doctorId`, `tenantId`. |
| `PATCH` | `/api/admin/citas/:id` | Editar cita. |
| `GET` | `/api/admin/pagos` | Lista global de pagos. Filtros: `metodo`, `tipoPago`, `tenantId`, `fechaDesde`, `fechaHasta`. |

Todos los endpoints `GET` soportan paginación via `?page=1&limit=20`.

---

## Frontend

### Routing (`client/src/App.tsx`)

Nueva ruta `/admin`:
- Si `isAuth && user.rol === "superadmin"` → render `AdminPanelPage`
- Si `isAuth && rol !== "superadmin"` → `<Redirect to="/" />`
- Si no autenticado → `<Redirect to="/login" />`

Post-login en `AuthContext.login()`:
- `rol === "superadmin"` → navegar a `/admin`
- cualquier otro → navegar a `/` (comportamiento actual sin cambios)

### Archivos nuevos

```
client/src/pages/AdminPanelPage.tsx
client/src/components/admin/AdminSidebar.tsx
client/src/components/admin/AdminTenantsView.tsx
client/src/components/admin/AdminUsersView.tsx
client/src/components/admin/AdminPacientesView.tsx
client/src/components/admin/AdminCitasView.tsx
client/src/components/admin/AdminPagosView.tsx
```

### Layout

`AdminPanelPage` replica la estructura de `Home.tsx`: sidebar fijo a la izquierda + área de contenido. El sidebar muestra las 5 secciones y el botón de logout. Usa los componentes `ui/` existentes (Table, Badge, Input, Select, Sheet, Dialog).

### Patrón de cada vista

1. **Filtros** — barra superior con inputs/selects según la entidad. Al cambiar un filtro se llama al endpoint con los query params correspondientes.
2. **Tabla** — columnas relevantes + columna de acciones (botón "Editar").
3. **Sheet de edición** — abre un panel lateral con los campos editables del registro. Al guardar hace `PATCH` al endpoint correspondiente y recarga la tabla.
4. **Paginación** — 20 registros por página, controles prev/next.

### `AdminUsersView` — campos editables

Al editar un usuario el superadmin puede cambiar: `nombre`, `email`, `rol` (admin/doctor), `activo` (toggle), y opcionalmente un campo "Nueva contraseña" (si se completa, el backend hashea y actualiza `passwordHash`).

---

## Variables de entorno

Agregar a `.env.example`:

```env
# Superadmin de plataforma (creado automáticamente al iniciar el servidor)
SUPERADMIN_EMAIL=admin@psicogestion.com
SUPERADMIN_PASSWORD=Admin1234!
```

---

## Lo que NO cambia

- El modelo `User` y sus endpoints existentes (`/api/auth`, `/api/doctores`, etc.) no se modifican.
- El flujo de login/registro para usuarios normales no cambia.
- El `Home.tsx` y todas las vistas existentes no se tocan.
- `tenant` puede ser `null` en `AuthContext` — ya era posible hoy, el superadmin solo lo hace explícito.
