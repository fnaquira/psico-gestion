# Diseño: Páginas Públicas para Google OAuth

**Fecha:** 2026-04-12
**Proyecto:** PsicoGestión / QhaliCare Gestión
**Dominio:** gestion.qhalicare.com
**Razón social:** BM Negocios EIRL — Arequipa, Perú
**Contacto privacidad:** privacidad@qhalicare.com

## Contexto

Google OAuth exige que la aplicación exponga tres URLs públicas en la pantalla de consentimiento:
- Página principal de la aplicación
- Política de Privacidad
- Condiciones del Servicio

Actualmente la raíz `/` redirige a `/login` (usuarios no autenticados) o al dashboard (autenticados). No existen páginas de Política de Privacidad ni Términos de Servicio.

## Decisiones de diseño

- **Idioma:** Español exclusivamente
- **Nivel legal:** Detallado con cláusulas conforme a Ley N° 29733 (Ley de Protección de Datos Personales de Perú) y D.S. 003-2013-JUS
- **Integración:** Páginas React dentro de la SPA existente, con layout institucional propio
- **Estructura de rutas:** `/` pública (landing), `/app` como punto de entrada autenticado

## Arquitectura de rutas

| Ruta | Componente | Auth requerida |
|------|-----------|----------------|
| `/` | `LandingPage` | No |
| `/privacy` | `PrivacyPolicyPage` | No |
| `/terms` | `TermsOfServicePage` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/app` | `Home` | Sí (redirige a `/login` si no autenticado) |
| `/admin` | `AdminPanelPage` | Sí (superadmin) |

**Cambio clave:** La lógica de redirección por rol que hoy vive en `/` se mueve a `/app`. Los usuarios que accedan a `/` siempre verán la landing pública, sin importar su estado de autenticación.

## Archivos nuevos

```
client/src/
  pages/
    LandingPage.tsx
    PrivacyPolicyPage.tsx
    TermsOfServicePage.tsx
  components/
    PublicLayout.tsx
```

## Componente `PublicLayout`

Layout compartido por las tres páginas públicas:

- **Header:** Logo QhaliCare a la izquierda + links de navegación a la derecha ("Inicio", "Política de Privacidad", "Términos de Servicio")
- **Footer:** Razón social (BM Negocios EIRL), email de contacto (privacidad@qhalicare.com), año, links a `/privacy` y `/terms`
- **Contenedor:** columna centrada, `max-w-4xl`, padding generoso
- **Estilo:** tokens de color oklch existentes, aspecto institucional — sin sidebar, sin componentes del dashboard

## Landing Page (`/`)

**URL pública:** `https://gestion.qhalicare.com`

### Secciones

1. **Hero**
   - Título: "Sistema de gestión para clínicas de psicología"
   - Subtítulo breve describiendo el valor: agenda, pacientes y pagos en un solo lugar
   - CTA primario: botón "Acceder al sistema" → `/login`

2. **Características** (3 cards horizontales)
   - Agenda y citas — gestión de calendario con integración Google Calendar
   - Gestión de pacientes — historial, tutores para menores, búsqueda rápida
   - Control de pagos — seguimiento de pagos y deudas por paciente

3. **Footer** (vía `PublicLayout`)

## Política de Privacidad (`/privacy`)

**URL pública:** `https://gestion.qhalicare.com/privacy`

Layout: `PublicLayout` + columna de texto centrada, `max-w-2xl`, tipografía de lectura.

### Secciones

1. **Responsable del tratamiento**
   - Nombre: BM Negocios EIRL
   - Domicilio: Arequipa, Perú
   - Contacto: privacidad@qhalicare.com

2. **Datos que recopilamos**
   - Datos de pacientes: nombre, fecha de nacimiento, datos de contacto, información de salud (diagnósticos, notas clínicas)
   - Datos de tutores/apoderados (para pacientes menores de edad)
   - Datos de profesionales: nombre, email, credenciales de acceso
   - Datos de uso del servicio: citas, pagos, deudas
   - Datos técnicos: dirección IP, logs de acceso, cookies de sesión

3. **Finalidad del tratamiento**
   - Prestación del servicio de gestión clínica psicológica
   - Agendamiento y seguimiento de citas
   - Control de pagos y facturación
   - Sincronización con Google Calendar (cuando el profesional la activa)

4. **Base legal**
   - Ley N° 29733 — Ley de Protección de Datos Personales del Perú
   - D.S. 003-2013-JUS — Reglamento de la Ley
   - Consentimiento del titular (Art. 13) y ejecución de contrato de servicio

5. **Integración con Google (Google OAuth / Google Calendar)**
   - El sistema solicita acceso a Google Calendar mediante OAuth 2.0
   - Datos accedidos: eventos del calendario del profesional
   - Finalidad: sincronizar citas agendadas en el sistema con el calendario del profesional
   - El acceso puede revocarse en cualquier momento desde la cuenta de Google del usuario
   - QhaliCare no almacena tokens de Google más allá de lo necesario para la sincronización activa

6. **Tiempo de retención**
   - Datos de pacientes y citas: durante la vigencia del contrato de servicio + 5 años adicionales por obligaciones legales
   - Datos técnicos (logs): 90 días
   - Credenciales de acceso: hasta la cancelación de la cuenta

7. **Derechos ARCO del titular**
   - Acceso, Rectificación, Cancelación y Oposición
   - Ejercicio vía email a privacidad@qhalicare.com
   - Plazo de respuesta: 20 días hábiles conforme a Ley N° 29733

8. **Transferencia a terceros**
   - No se venden ni ceden datos a terceros con fines comerciales
   - Proveedores de infraestructura (hosting, base de datos en la nube): tratamiento bajo acuerdo de confidencialidad
   - Google LLC: únicamente para la integración de Google Calendar, bajo sus propios términos

9. **Seguridad**
   - Contraseñas almacenadas con hash bcrypt
   - Comunicaciones cifradas mediante TLS/HTTPS
   - Acceso a datos restringido por roles (profesional solo accede a sus propios pacientes)

10. **Contacto**
    - privacidad@qhalicare.com
    - Para consultas, ejercicio de derechos ARCO o reclamaciones

11. **Última actualización:** [fecha de deploy]

## Términos de Servicio (`/terms`)

**URL pública:** `https://gestion.qhalicare.com/terms`

Layout: idéntico al de Política de Privacidad.

### Secciones

1. **Identificación**
   - Servicio: QhaliCare Gestión
   - Proveedor: BM Negocios EIRL, Arequipa, Perú

2. **Aceptación**
   - El uso del servicio implica aceptación de estos términos
   - Si no se aceptan, no debe usarse el servicio

3. **Descripción del servicio**
   - Plataforma web de gestión para clínicas de psicología
   - Funcionalidades: agenda de citas, gestión de pacientes, control de pagos, integración con Google Calendar

4. **Condiciones de la cuenta**
   - El usuario es responsable de mantener la confidencialidad de sus credenciales
   - Una cuenta por profesional; no se permite el uso compartido
   - El usuario debe proveer información veraz al registrarse

5. **Obligaciones del usuario**
   - Usar el servicio conforme a la Ley N° 29733 respecto a los datos de pacientes que gestiona
   - No usar el servicio para fines ilícitos
   - No intentar acceder a datos de otros tenants/clínicas

6. **Propiedad intelectual**
   - El software, diseño y marca QhaliCare son propiedad de BM Negocios EIRL
   - El usuario retiene la propiedad de los datos de sus pacientes

7. **Limitación de responsabilidad**
   - BM Negocios EIRL no se responsabiliza por pérdidas derivadas de uso incorrecto del sistema
   - El servicio se provee "tal cual" con disponibilidad razonable pero sin garantía de uptime absoluto

8. **Suspensión y cancelación**
   - BM Negocios EIRL puede suspender cuentas que violen estos términos
   - El usuario puede cancelar su cuenta en cualquier momento contactando a privacidad@qhalicare.com

9. **Modificaciones**
   - BM Negocios EIRL puede modificar estos términos con aviso previo de 15 días
   - El uso continuado del servicio implica aceptación de los nuevos términos

10. **Ley aplicable y jurisdicción**
    - Ley peruana
    - Jurisdicción: Juzgados de Arequipa, Perú

11. **Contacto**
    - privacidad@qhalicare.com

## Cambios en archivos existentes

- **`client/src/App.tsx`:** agregar rutas `/`, `/privacy`, `/terms`; mover lógica de redirección de `/` a `/app`
- **Sin cambios** en el servidor (Express): el SPA fallback existente ya servirá las nuevas rutas correctamente

## URLs para Google OAuth Console

Una vez desplegado:

| Campo en Google Console | URL |
|------------------------|-----|
| Página principal de la aplicación | `https://gestion.qhalicare.com` |
| Política de Privacidad | `https://gestion.qhalicare.com/privacy` |
| Condiciones del Servicio | `https://gestion.qhalicare.com/terms` |
