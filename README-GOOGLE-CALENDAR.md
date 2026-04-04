# Integración Google Calendar — PsicoGestión

Cada doctor puede vincular su propia cuenta de Google Calendar. Al crear, modificar o cancelar una cita, el sistema la sincroniza automáticamente con el calendario del doctor asignado.

---

## Arquitectura

```
Doctor vincula su Google Calendar
       ↓
OAuth 2.0 por usuario (cada doctor tiene sus propios tokens)
       ↓
Tokens cifrados con AES-256-CBC en MongoDB
       ↓
Al crear/editar/cancelar una Cita → sync fire-and-forget al GCal del doctor
```

- La fuente de verdad es siempre la app (no hay sync bidireccional).
- Si Google Calendar falla, la cita igual se guarda; queda marcada con `googleSyncStatus: "error"`.
- Cada doctor gestiona su propia vinculación de forma independiente.

---

## Configuración inicial

### 1. Crear proyecto en Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un nuevo proyecto (ej. `psico-gestion`)
3. Habilitar la API: **Google Calendar API**
   - Menú → APIs y servicios → Biblioteca → buscar "Google Calendar API" → Habilitar
4. Crear credenciales OAuth 2.0:
   - Menú → APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth
   - Tipo de aplicación: **Aplicación web**
   - Nombre: `PsicoGestión`
   - URIs de redirección autorizados: agregar la URL de callback (ver abajo)
5. Copiar el **Client ID** y **Client Secret**

### 2. Variables de entorno

Agregar en tu `.env` (o en el archivo de entorno de producción):

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# Clave de cifrado para tokens (32 bytes en hexadecimal = 64 caracteres hex)
TOKEN_ENCRYPTION_KEY=a1b2c3d4e5f6...  # genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Para producción**, reemplazar `GOOGLE_REDIRECT_URI` con el dominio real:
```env
GOOGLE_REDIRECT_URI=https://tudominio.com/api/google-calendar/callback
```

Y agregar esa misma URL en Google Cloud Console → Credenciales → URIs de redirección.

### 3. Generar TOKEN_ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guardar este valor de forma segura (no compartir, no versionar).

---

## Flujo del doctor para vincular su calendario

1. Doctor va a su página de **Configuración** en la app
2. Ve el panel "Google Calendar" → botón **Conectar con Google Calendar**
3. La app redirige a Google para pedir permiso (`calendar.events` scope)
4. Doctor acepta → Google redirige de vuelta a `/api/google-calendar/callback`
5. El servidor intercambia el código por tokens y los guarda cifrados en su perfil
6. El doctor regresa a la app con la vinculación activa

A partir de este momento, cada cita que se cree o modifique para ese doctor se sincronizará automáticamente.

---

## API Endpoints

Todos los endpoints (excepto `/callback`) requieren autenticación JWT.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/google-calendar/status` | Estado de vinculación del doctor actual |
| `GET` | `/api/google-calendar/auth-url` | Genera la URL de consentimiento de Google |
| `GET` | `/api/google-calendar/callback` | Callback OAuth (llamado por Google, no por el cliente) |
| `PATCH` | `/api/google-calendar/toggle-sync` | Activa/pausa la sincronización |
| `DELETE` | `/api/google-calendar/disconnect` | Desvincula el calendario |

### Respuestas

**GET /status** (conectado):
```json
{
  "connected": true,
  "syncEnabled": true,
  "calendarId": "primary",
  "connectedAt": "2026-03-30T12:00:00.000Z"
}
```

**GET /status** (no conectado):
```json
{ "connected": false }
```

**GET /auth-url**:
```json
{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

---

## Modelos de datos extendidos

### User (campo agregado)

```ts
googleCalendar?: {
  accessToken: string;      // cifrado en reposo (AES-256-CBC)
  refreshToken: string;     // cifrado en reposo
  calendarId: string;       // "primary" por defecto
  syncEnabled: boolean;     // el doctor puede pausar sin desconectar
  connectedAt: Date;
}
```

### Cita (campos agregados)

```ts
googleCalendarEventId?: string;   // ID del evento en Google Calendar
googleSyncStatus: "pending" | "synced" | "error" | "skipped";
```

---

## Formato del evento creado en Google Calendar

```
Título:      "Sesión de seguimiento — Ana García"
Descripción: "Notas: texto libre..."
Inicio:      2026-04-01T10:00:00-03:00
Fin:         2026-04-01T11:00:00-03:00
Estado:      confirmed (o cancelled si la cita fue cancelada)
```

El timezone usado es el configurado en la clínica (`Tenant.settings.timezone`), por defecto `America/Argentina/Buenos_Aires`.

---

## Comportamiento de sync

| Evento en app | Acción en Google Calendar |
|---------------|--------------------------|
| Crear cita | Crear evento → guardar `googleCalendarEventId` |
| Editar cita | Actualizar evento existente |
| Cancelar cita (DELETE) | Marcar evento como `cancelled` |
| Doctor sin GCal vinculado | No sync, `googleSyncStatus: "skipped"` |
| Error de API de Google | `googleSyncStatus: "error"`, cita igual guardada |

El sync es **fire-and-forget**: la respuesta HTTP al cliente no espera a que Google confirme. Esto garantiza que la app no se vuelva lenta si Google tiene demoras.

---

## Seguridad

- **Scope mínimo**: solo se pide `https://www.googleapis.com/auth/calendar.events` (no acceso completo a la cuenta).
- **Cifrado en reposo**: access token y refresh token se cifran con AES-256-CBC antes de guardarse en MongoDB. Sin `TOKEN_ENCRYPTION_KEY`, los datos de la BD son inútiles.
- **CSRF protection**: el parámetro `state` en el flujo OAuth contiene el `userId` codificado en base64url, que se verifica en el callback.
- **Renovación automática**: el SDK de Google renueva el access token usando el refresh token cuando detecta que está expirado. El nuevo access token se guarda cifrado automáticamente.

---

## Troubleshooting

### El botón "Conectar" no redirige a Google
- Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén definidos.
- Revisar los logs del servidor (`[GCal]` prefix).

### Error "redirect_uri_mismatch" en Google
- El `GOOGLE_REDIRECT_URI` en el `.env` debe coincidir exactamente con el URI registrado en Google Cloud Console (incluyendo protocolo y puerto).

### Las citas no se sincronizan
- Verificar que el doctor tiene vinculado su calendario (`GET /api/google-calendar/status`).
- Verificar que `syncEnabled: true`.
- Revisar el campo `googleSyncStatus` en la cita en MongoDB.
- Revisar los logs del servidor para errores `[GCal]`.

### TOKEN_ENCRYPTION_KEY inválida
- Debe ser exactamente 64 caracteres hexadecimales (32 bytes).
- Generarla con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Uso del componente frontend

```tsx
import { GoogleCalendarSettings } from "@/components/GoogleCalendarSettings";

// En la página de configuración del doctor:
<GoogleCalendarSettings />
```

El componente maneja internamente:
- Carga del estado inicial
- Redirect al flujo OAuth
- Detección del retorno desde Google (query params `?gcal=success|error`)
- Toggle de sync activo/pausado
- Desconexión con confirmación
