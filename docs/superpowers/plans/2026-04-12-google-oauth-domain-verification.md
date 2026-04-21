# Google OAuth Domain Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que Google verifique la propiedad de `gestion.qhalicare.com` para la pantalla de consentimiento OAuth, añadiendo infraestructura de verificación y mejorando los meta datos de la landing page.

**Architecture:** Dos cambios en el codebase (meta tags en `client/index.html` + JSON-LD en `LandingPage.tsx`) + un paso manual en Google Search Console que el usuario completa fuera del código. El directorio `client/public/` ya existe y Vite copia su contenido verbatim a `dist/public/`, así que un archivo `googleXXXX.html` colocado allí queda accesible en la raíz del dominio.

**Tech Stack:** Vite (root: `client/`), React 19, TypeScript, Express 4 (SPA fallback)

---

## Por qué ocurre el error

Google OAuth Console exige que el dominio de la URL principal (`https://gestion.qhalicare.com`) esté **verificado en Google Search Console** con la misma cuenta de Google que administra la app OAuth. Sin esa verificación, Google no puede confirmar que eres el propietario del dominio, independientemente de si la página está en línea.

## Método de verificación recomendado: meta tag HTML

Es el método más sencillo para un SPA: añadir `<meta name="google-site-verification" content="TU_CÓDIGO">` al `<head>` del HTML. Google extrae ese valor al rastrear la URL.

---

## Archivos a modificar/crear

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `client/index.html` | Modificar | Meta tags SEO + google-site-verification |
| `client/src/pages/LandingPage.tsx` | Modificar | JSON-LD structured data (WebApplication/Organization) |
| `client/public/` | Ya existe | Directorio para archivo de verificación alternativo |

---

## PASO PREVIO (manual — fuera del código)

Antes de ejecutar las tareas de código, **obtén tu código de verificación de Google Search Console:**

1. Ve a [https://search.google.com/search-console](https://search.google.com/search-console)
2. Haz clic en "Añadir propiedad"
3. Tipo de propiedad: **"URL prefix"** → ingresa `https://gestion.qhalicare.com`
4. En los métodos de verificación, selecciona **"HTML tag"**
5. Copia el `content` del meta tag que te muestra (ejemplo: `AbCdEfGhIjKlMnOpQrStUvWxYz12345678`)
6. **No hagas clic en "Verify" todavía** — primero despliega los cambios de este plan

---

## Task 1: Meta tags SEO y google-site-verification en client/index.html

**Archivos:**
- Modify: `client/index.html`

El archivo actual es muy básico. Añadimos: título correcto, descripción, Open Graph, canonical, y el meta tag de verificación de Google.

- [ ] **Step 1: Reemplazar el contenido de `client/index.html`**

Reemplaza el contenido completo del archivo con:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />

    <!-- SEO básico -->
    <title>QhaliCare Gestión — Sistema para clínicas de psicología</title>
    <meta
      name="description"
      content="Plataforma web de gestión para clínicas de psicología: agenda de citas, historial de pacientes, control de pagos e integración con Google Calendar. Desarrollado por BM Negocios EIRL."
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://gestion.qhalicare.com" />

    <!-- Google Site Verification (obtener código en search.google.com/search-console) -->
    <meta name="google-site-verification" content="REEMPLAZAR_CON_TU_CÓDIGO" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://gestion.qhalicare.com" />
    <meta property="og:title" content="QhaliCare Gestión — Sistema para clínicas de psicología" />
    <meta
      property="og:description"
      content="Gestiona citas, pacientes y pagos de tu clínica de psicología en un solo lugar. Integración nativa con Google Calendar."
    />
    <meta property="og:locale" content="es_PE" />
    <meta property="og:site_name" content="QhaliCare Gestión" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

> **IMPORTANTE:** Reemplaza `REEMPLAZAR_CON_TU_CÓDIGO` con el valor real obtenido en el Paso Previo. Si aún no lo tienes, deja el placeholder — el commit aún es válido, pero la verificación no funcionará hasta que pongas el código real.

- [ ] **Step 2: Verificar que el HTML es sintácticamente correcto**

Abre `client/index.html` y confirma visualmente que:
- El `<meta name="google-site-verification">` tiene el content correcto (o el placeholder si aún no tienes el código)
- No hay etiquetas `<meta>` duplicadas
- El `<title>` dice "QhaliCare Gestión"

- [ ] **Step 3: Commit**

```bash
git add client/index.html
git commit -m "feat(seo): add meta tags, OG, canonical and google-site-verification placeholder"
```

---

## Task 2: Datos estructurados JSON-LD en LandingPage.tsx

**Archivos:**
- Modify: `client/src/pages/LandingPage.tsx`

Los datos estructurados Schema.org ayudan a Google a entender qué es la aplicación y quién la opera. Esto es relevante tanto para SEO como para la revisión manual de Google en el proceso OAuth.

- [ ] **Step 1: Añadir el JSON-LD via useEffect en LandingPage.tsx**

El archivo actual ya tiene un `useEffect` para el `document.title`. Añade un segundo `useEffect` para inyectar el script JSON-LD. El archivo completo debe quedar así:

```tsx
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Calendar, Users, CreditCard } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const features = [
  {
    icon: Calendar,
    title: 'Agenda y citas',
    description:
      'Gestiona tu calendario de citas con vista semanal e integración nativa con Google Calendar.',
  },
  {
    icon: Users,
    title: 'Gestión de pacientes',
    description:
      'Historial completo por paciente, soporte para tutores de menores y búsqueda rápida.',
  },
  {
    icon: CreditCard,
    title: 'Control de pagos',
    description:
      'Seguimiento de pagos y deudas por paciente, con resumen financiero en el dashboard.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'QhaliCare Gestión',
  url: 'https://gestion.qhalicare.com',
  description:
    'Plataforma web de gestión para clínicas de psicología: agenda de citas, historial de pacientes, control de pagos e integración con Google Calendar.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'es-PE',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'PEN',
    description: 'Acceso mediante suscripción para clínicas registradas',
  },
  author: {
    '@type': 'Organization',
    name: 'BM Negocios EIRL',
    url: 'https://gestion.qhalicare.com',
    email: 'privacidad@qhalicare.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Arequipa',
      addressCountry: 'PE',
    },
  },
};

export default function LandingPage() {
  useEffect(() => {
    document.title = 'QhaliCare Gestión — Sistema para clínicas de psicología';
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-accent/60 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Sistema de gestión para
            <br />
            <span className="text-primary">clínicas de psicología</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Agenda citas, gestiona pacientes y controla pagos en un solo lugar.
            Integración nativa con Google Calendar.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Acceder al sistema
          </Link>
        </div>
      </section>

      {/* Características */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="sr-only">Características principales</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
```

- [ ] **Step 2: Verificar que no hay errores de TypeScript**

```bash
pnpm run check
```

Expected: sin errores (0 errors).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat(seo): add JSON-LD structured data (WebApplication + Organization) to landing page"
```

---

## Task 3: Build, deploy y completar verificación en Google Search Console

Este task es mayormente manual. Los pasos de código son mínimos.

- [ ] **Step 1: Confirmar que el código de verificación está en client/index.html**

Abre `client/index.html` y asegúrate de que la línea sea:
```html
<meta name="google-site-verification" content="TU_CÓDIGO_REAL_AQUÍ" />
```
Si todavía dice `REEMPLAZAR_CON_TU_CÓDIGO`, edita el archivo ahora con el código real de Google Search Console.

Si editaste el archivo, haz commit:
```bash
git add client/index.html
git commit -m "feat(seo): add google-site-verification code"
```

- [ ] **Step 2: Hacer build de producción**

```bash
pnpm run build
```

Expected: sin errores, genera `dist/public/`.

- [ ] **Step 3: Desplegar a producción**

Sube el build a `gestion.qhalicare.com` siguiendo el proceso de deploy habitual del proyecto (Docker, VPS, etc.).

- [ ] **Step 4: Verificar que el meta tag está en la página en producción**

Abre `https://gestion.qhalicare.com` en el navegador. Abre DevTools → Sources o `Ctrl+U`. Busca `google-site-verification`. Debe aparecer el meta tag con tu código.

- [ ] **Step 5: Completar verificación en Google Search Console**

1. Ve a [https://search.google.com/search-console](https://search.google.com/search-console)
2. Selecciona la propiedad `https://gestion.qhalicare.com`
3. Haz clic en "Verify"
4. Espera la confirmación: "Ownership verified"

- [ ] **Step 6: Reintentar verificación en Google OAuth Console**

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → OAuth consent screen
2. En el campo "Application homepage", ingresa `https://gestion.qhalicare.com`
3. Haz clic en "Save and continue" o el botón de verificar
4. El error "no está registrado a tu nombre" ya no debe aparecer

---

## Alternativa: verificación por archivo HTML (si el meta tag no funciona)

Si por alguna razón Google no reconoce el meta tag (por el SPA rendering), puedes usar el método de archivo HTML:

1. En Google Search Console, selecciona el método "HTML file" en vez de "HTML tag"
2. Descarga el archivo (ejemplo: `google1a2b3c4d5e6f7g8h.html`)
3. Colócalo en `client/public/` (este directorio ya existe)
4. Haz build y despliega
5. Google lo encontrará en `https://gestion.qhalicare.com/google1a2b3c4d5e6f7g8h.html`
6. Completa la verificación en Search Console

---

## Resumen de cambios en el codebase

| Archivo | Cambio |
|---------|--------|
| `client/index.html` | Título correcto, description, OG tags, canonical, google-site-verification |
| `client/src/pages/LandingPage.tsx` | JSON-LD structured data (WebApplication + Organization) |
