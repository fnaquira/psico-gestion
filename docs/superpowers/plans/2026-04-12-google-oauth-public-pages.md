# Google OAuth Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear tres páginas públicas React (landing `/`, política de privacidad `/privacy`, términos de servicio `/terms`) requeridas por Google OAuth, con layout institucional propio y contenido legal conforme a la Ley N° 29733 de Perú.

**Architecture:** Se agregan 3 páginas y 1 layout compartido (`PublicLayout`) a la SPA React existente. Las rutas `/`, `/privacy` y `/terms` son públicas (sin auth). La ruta raíz `/` pasa a ser la landing; la lógica de redirección por rol se mueve a `/app`.

**Tech Stack:** React 19, Wouter (routing), Tailwind CSS 4 (oklch tokens), Lucide React, TypeScript

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Crear | `client/src/components/PublicLayout.tsx` | Header con logo + nav, footer legal, wrapper de páginas públicas |
| Crear | `client/src/pages/LandingPage.tsx` | Página de inicio pública (`/`) |
| Crear | `client/src/pages/PrivacyPolicyPage.tsx` | Política de privacidad (`/privacy`) |
| Crear | `client/src/pages/TermsOfServicePage.tsx` | Términos de servicio (`/terms`) |
| Modificar | `client/src/App.tsx` | Agregar rutas públicas; mover lógica de `/` a `/app` |

---

## Task 1: Componente `PublicLayout`

**Files:**
- Create: `client/src/components/PublicLayout.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// client/src/components/PublicLayout.tsx
import React from 'react';
import { Link } from 'wouter';
import { HeartPulse } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-sidebar rounded-lg flex items-center justify-center border border-sidebar-primary/30">
              <HeartPulse size={16} className="text-sidebar-primary" />
            </div>
            <span
              className="font-semibold text-sm"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              QhaliCare Gestión
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link
              href="/login"
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">BM Negocios EIRL</p>
            <p>Arequipa, Perú · privacidad@qhalicare.com</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos de Servicio
            </Link>
          </div>
          <p>© {new Date().getFullYear()} BM Negocios EIRL</p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
pnpm run check
```

Expected: sin errores TypeScript para el nuevo archivo.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/PublicLayout.tsx
git commit -m "feat(public): add PublicLayout component with header and footer"
```

---

## Task 2: Landing Page (`/`)

**Files:**
- Create: `client/src/pages/LandingPage.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// client/src/pages/LandingPage.tsx
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

export default function LandingPage() {
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
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Acceder al sistema
          </Link>
        </div>
      </section>

      {/* Características */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
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

- [ ] **Step 2: Verificar tipos**

```bash
pnpm run check
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat(public): add LandingPage at /"
```

---

## Task 3: Política de Privacidad (`/privacy`)

**Files:**
- Create: `client/src/pages/PrivacyPolicyPage.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// client/src/pages/PrivacyPolicyPage.tsx
import PublicLayout from '@/components/PublicLayout';

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1
          className="text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Política de Privacidad
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última actualización: abril de 2026
        </p>

        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>BM Negocios EIRL</strong>, con domicilio en Arequipa, Perú, es
            el responsable del tratamiento de los datos personales recopilados a
            través del servicio QhaliCare Gestión (en adelante, "el Servicio"),
            disponible en{' '}
            <a
              href="https://gestion.qhalicare.com"
              className="text-primary hover:underline"
            >
              gestion.qhalicare.com
            </a>
            .
          </p>
          <p className="mt-2">
            Contacto:{' '}
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Recopilamos las siguientes categorías de datos personales:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Datos de pacientes:</strong> nombre completo, fecha de
              nacimiento, datos de contacto, información de salud (diagnósticos,
              notas clínicas, historial de citas).
            </li>
            <li>
              <strong>Datos de tutores o apoderados:</strong> nombre, relación con
              el paciente y datos de contacto (aplicable a pacientes menores de
              edad).
            </li>
            <li>
              <strong>Datos de profesionales:</strong> nombre completo, dirección
              de correo electrónico y credenciales de acceso.
            </li>
            <li>
              <strong>Datos de uso del servicio:</strong> citas agendadas, registros
              de pagos y deudas.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP, registros de acceso
              (logs) y cookies de sesión necesarias para el funcionamiento del
              Servicio.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <p>Los datos personales son tratados para las siguientes finalidades:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Prestación del servicio de gestión clínica psicológica.</li>
            <li>Agendamiento, seguimiento y registro de citas.</li>
            <li>Control de pagos y seguimiento de deudas.</li>
            <li>
              Sincronización con Google Calendar, cuando el profesional activa
              dicha integración.
            </li>
            <li>
              Cumplimiento de obligaciones legales aplicables.
            </li>
          </ul>
        </Section>

        <Section title="4. Base legal del tratamiento">
          <p>
            El tratamiento de datos personales se realiza conforme a la{' '}
            <strong>Ley N° 29733</strong> — Ley de Protección de Datos Personales
            del Perú — y su reglamento aprobado por{' '}
            <strong>D.S. 003-2013-JUS</strong>, en particular bajo las siguientes
            bases legales:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Consentimiento del titular (Art. 13, literal a): obtenido al momento
              del registro en el Servicio.
            </li>
            <li>
              Ejecución del contrato de prestación del servicio (Art. 13, literal
              b).
            </li>
            <li>
              Cumplimiento de obligaciones legales a cargo del responsable (Art. 13,
              literal c).
            </li>
          </ul>
        </Section>

        <Section title="5. Integración con Google (OAuth 2.0 / Google Calendar)">
          <p>
            El Servicio permite la integración opcional con Google Calendar mediante
            el protocolo OAuth 2.0. Al activar esta integración:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Solicitamos acceso de lectura y escritura a los eventos del calendario
              del profesional autorizado.
            </li>
            <li>
              Los datos accedidos se usan exclusivamente para sincronizar las citas
              agendadas en el Servicio con el calendario del profesional.
            </li>
            <li>
              No compartimos datos de Google Calendar con terceros ni los usamos
              para publicidad o análisis de comportamiento.
            </li>
            <li>
              Los tokens de acceso de Google se almacenan de forma segura y se
              eliminan automáticamente al revocar la integración.
            </li>
            <li>
              El profesional puede revocar el acceso en cualquier momento desde su
              cuenta de Google en{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                myaccount.google.com/permissions
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">
            El uso de datos obtenidos mediante las API de Google cumple con la{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Política de Datos de Usuario de los Servicios de API de Google
            </a>
            , incluidos los requisitos de uso limitado.
          </p>
        </Section>

        <Section title="6. Tiempo de retención">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Datos de pacientes y citas:</strong> durante la vigencia del
              contrato de servicio y por un periodo adicional de 5 años, conforme a
              las obligaciones legales aplicables.
            </li>
            <li>
              <strong>Datos técnicos (logs):</strong> 90 días.
            </li>
            <li>
              <strong>Credenciales de acceso:</strong> hasta la cancelación de la
              cuenta del profesional.
            </li>
          </ul>
        </Section>

        <Section title="7. Derechos del titular (ARCO)">
          <p>
            Conforme a la Ley N° 29733, el titular de los datos personales tiene
            derecho a:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Acceso:</strong> conocer qué datos personales suyos son
              tratados.
            </li>
            <li>
              <strong>Rectificación:</strong> solicitar la corrección de datos
              inexactos o incompletos.
            </li>
            <li>
              <strong>Cancelación:</strong> solicitar la supresión de sus datos
              cuando ya no sean necesarios para la finalidad para la que fueron
              recopilados.
            </li>
            <li>
              <strong>Oposición:</strong> oponerse al tratamiento de sus datos en
              los casos previstos por la ley.
            </li>
          </ul>
          <p className="mt-2">
            Para ejercer cualquiera de estos derechos, el titular debe enviar una
            solicitud escrita a{' '}
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
            . El plazo de respuesta es de{' '}
            <strong>20 días hábiles</strong> contados desde la recepción de la
            solicitud.
          </p>
        </Section>

        <Section title="8. Transferencia a terceros">
          <p>
            BM Negocios EIRL no vende ni cede datos personales a terceros con fines
            comerciales. Los datos pueden ser compartidos únicamente con:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Proveedores de infraestructura</strong> (hosting y base de
              datos en la nube): bajo acuerdos de confidencialidad y sin autorización
              para usar los datos con fines propios.
            </li>
            <li>
              <strong>Google LLC:</strong> únicamente en el contexto de la
              integración opcional con Google Calendar, bajo los términos de servicio
              y la política de privacidad de Google.
            </li>
            <li>
              <strong>Autoridades competentes:</strong> cuando sea requerido por ley
              o mandato judicial.
            </li>
          </ul>
        </Section>

        <Section title="9. Seguridad de los datos">
          <p>
            Aplicamos medidas técnicas y organizativas para proteger los datos
            personales, incluyendo:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Contraseñas almacenadas con algoritmo de hash bcrypt (factor de
              costo 12).
            </li>
            <li>
              Comunicaciones cifradas mediante TLS/HTTPS en toda la aplicación.
            </li>
            <li>
              Control de acceso por roles: cada profesional accede exclusivamente
              a los pacientes de su clínica.
            </li>
            <li>Acceso a la base de datos restringido a la infraestructura del servicio.</li>
          </ul>
        </Section>

        <Section title="10. Contacto">
          <p>
            Para consultas sobre esta Política de Privacidad, ejercicio de derechos
            ARCO o reclamaciones, puede contactarnos en:
          </p>
          <p className="mt-2">
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
          </p>
        </Section>
      </div>
    </PublicLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
pnpm run check
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/PrivacyPolicyPage.tsx
git commit -m "feat(public): add PrivacyPolicyPage with Ley 29733 compliance"
```

---

## Task 4: Términos de Servicio (`/terms`)

**Files:**
- Create: `client/src/pages/TermsOfServicePage.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// client/src/pages/TermsOfServicePage.tsx
import PublicLayout from '@/components/PublicLayout';

export default function TermsOfServicePage() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1
          className="text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Términos de Servicio
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última actualización: abril de 2026
        </p>

        <Section title="1. Identificación del servicio y del proveedor">
          <p>
            <strong>QhaliCare Gestión</strong> es un servicio web de gestión para
            clínicas de psicología, desarrollado y operado por{' '}
            <strong>BM Negocios EIRL</strong>, con domicilio en Arequipa, Perú
            (en adelante, "el Proveedor").
          </p>
          <p className="mt-2">
            Contacto:{' '}
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
          </p>
        </Section>

        <Section title="2. Aceptación de los términos">
          <p>
            El acceso y uso del Servicio implica la aceptación plena e
            incondicional de los presentes Términos de Servicio. Si el usuario no
            está de acuerdo con alguno de los términos aquí establecidos, debe
            abstenerse de usar el Servicio.
          </p>
        </Section>

        <Section title="3. Descripción del servicio">
          <p>
            QhaliCare Gestión es una plataforma web que permite a profesionales de
            la salud mental:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Agendar y gestionar citas con pacientes.</li>
            <li>
              Administrar fichas de pacientes, incluyendo soporte para tutores de
              pacientes menores de edad.
            </li>
            <li>Controlar pagos y seguimiento de deudas por paciente.</li>
            <li>
              Sincronizar citas con Google Calendar (integración opcional).
            </li>
          </ul>
          <p className="mt-2">
            El Proveedor se reserva el derecho de modificar, ampliar o reducir las
            funcionalidades del Servicio, notificando a los usuarios con la debida
            antelación.
          </p>
        </Section>

        <Section title="4. Condiciones de la cuenta">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              El usuario es el único responsable de mantener la confidencialidad de
              sus credenciales de acceso (usuario y contraseña).
            </li>
            <li>
              Cada cuenta corresponde a un profesional individual. No está permitido
              el uso compartido de credenciales entre distintas personas.
            </li>
            <li>
              El usuario debe proveer información veraz, completa y actualizada al
              momento del registro.
            </li>
            <li>
              El usuario debe notificar inmediatamente al Proveedor ante cualquier
              uso no autorizado de su cuenta.
            </li>
          </ul>
        </Section>

        <Section title="5. Obligaciones del usuario">
          <p>El usuario se compromete a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Usar el Servicio conforme a la Ley N° 29733 (Ley de Protección de
              Datos Personales del Perú) respecto a los datos personales de pacientes
              que gestione a través de la plataforma.
            </li>
            <li>
              No usar el Servicio para actividades ilícitas, fraudulentas o que
              vulneren los derechos de terceros.
            </li>
            <li>
              No intentar acceder a datos de otras clínicas o tenants del sistema.
            </li>
            <li>
              No realizar ingeniería inversa, descompilar ni intentar obtener el
              código fuente del Servicio.
            </li>
          </ul>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p>
            El software, diseño, marca y contenidos del Servicio son propiedad
            exclusiva de BM Negocios EIRL. El usuario no adquiere ningún derecho
            sobre ellos por el simple uso del Servicio.
          </p>
          <p className="mt-2">
            El usuario retiene la titularidad y propiedad de todos los datos de
            pacientes que registre en el Servicio. BM Negocios EIRL no reivindica
            derechos de propiedad sobre dichos datos.
          </p>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>
            El Servicio se provee "tal cual" ("as is"). BM Negocios EIRL no
            garantiza disponibilidad ininterrumpida ni libre de errores, aunque se
            compromete a mantener una disponibilidad razonable.
          </p>
          <p className="mt-2">
            BM Negocios EIRL no será responsable por pérdidas o daños derivados de:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Uso incorrecto o negligente del Servicio por parte del usuario.</li>
            <li>
              Interrupciones del servicio causadas por factores fuera del control
              del Proveedor (fuerza mayor, fallas de terceros proveedores de
              infraestructura, etc.).
            </li>
            <li>
              Pérdida de datos atribuible a acciones del propio usuario.
            </li>
          </ul>
        </Section>

        <Section title="8. Suspensión y cancelación">
          <p>
            BM Negocios EIRL se reserva el derecho de suspender o cancelar el acceso
            al Servicio a cualquier usuario que incumpla los presentes Términos,
            previa notificación cuando sea posible.
          </p>
          <p className="mt-2">
            El usuario puede solicitar la cancelación de su cuenta en cualquier
            momento escribiendo a{' '}
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
            . Tras la cancelación, los datos se conservarán conforme a lo
            establecido en la Política de Privacidad.
          </p>
        </Section>

        <Section title="9. Modificaciones a los términos">
          <p>
            BM Negocios EIRL puede modificar los presentes Términos de Servicio
            en cualquier momento. Los cambios se notificarán al usuario con al
            menos <strong>15 días de antelación</strong> mediante correo electrónico
            o aviso visible en el Servicio.
          </p>
          <p className="mt-2">
            El uso continuado del Servicio tras la entrada en vigor de los nuevos
            Términos implica su aceptación. Si el usuario no acepta los cambios,
            deberá cancelar su cuenta antes de la fecha de entrada en vigor.
          </p>
        </Section>

        <Section title="10. Ley aplicable y jurisdicción">
          <p>
            Los presentes Términos de Servicio se rigen por la legislación peruana.
            Para cualquier controversia derivada del uso del Servicio, las partes se
            someten a la jurisdicción de los Juzgados y Tribunales de{' '}
            <strong>Arequipa, Perú</strong>, con renuncia a cualquier otro fuero que
            pudiera corresponderles.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para cualquier consulta sobre estos Términos de Servicio, puede
            contactarnos en:
          </p>
          <p className="mt-2">
            <a
              href="mailto:privacidad@qhalicare.com"
              className="text-primary hover:underline"
            >
              privacidad@qhalicare.com
            </a>
          </p>
        </Section>
      </div>
    </PublicLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
pnpm run check
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/TermsOfServicePage.tsx
git commit -m "feat(public): add TermsOfServicePage with Peruvian law compliance"
```

---

## Task 5: Actualizar rutas en `App.tsx`

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Reemplazar el contenido completo de `App.tsx`**

```tsx
// client/src/App.tsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPanelPage from "./pages/AdminPanelPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";

function Router() {
  const { isAuth, loading, user, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isSuperAdmin = isAuth && user?.rol === "superadmin";

  return (
    <Switch>
      {/* Páginas públicas — siempre accesibles sin auth */}
      <Route path="/" component={LandingPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />

      {/* Auth routes */}
      <Route path="/login">
        {!isAuth ? <LoginPage /> : isSuperAdmin ? <Redirect to="/admin" /> : <Redirect to="/app" />}
      </Route>
      <Route path="/register">
        {isAuth ? <Redirect to="/app" /> : <RegisterPage />}
      </Route>
      <Route path="/forgot-password">
        {isAuth ? <Redirect to="/app" /> : <ForgotPasswordPage />}
      </Route>

      {/* Panel superadmin */}
      <Route path="/admin">
        {!isAuth ? <Redirect to="/login" /> : !isSuperAdmin ? <Redirect to="/app" /> : <AdminPanelPage onLogout={logout} />}
      </Route>

      {/* App principal — punto de entrada autenticado */}
      <Route path="/app">
        {!isAuth ? <Redirect to="/login" /> : isSuperAdmin ? <Redirect to="/admin" /> : <Home onLogout={logout} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 2: Verificar tipos**

```bash
pnpm run check
```

Expected: sin errores.

- [ ] **Step 3: Verificar en el navegador**

```bash
pnpm run dev
```

Verificar manualmente:
- `http://localhost:3000/` → landing page con hero y 3 cards
- `http://localhost:3000/privacy` → política de privacidad con 10 secciones
- `http://localhost:3000/terms` → términos de servicio con 11 secciones
- `http://localhost:3000/login` → formulario de login (sin cambios)
- `http://localhost:3000/app` → redirige a `/login` si no autenticado
- Header y footer de `PublicLayout` aparecen en las 3 páginas públicas
- Los links del footer navegan correctamente entre páginas

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(public): wire public routes /, /privacy, /terms — move app entry to /app"
```

---

## URLs para Google OAuth Console

Una vez desplegado en producción, registrar en Google Cloud Console:

| Campo | URL |
|-------|-----|
| Página principal de la aplicación | `https://gestion.qhalicare.com` |
| Política de Privacidad | `https://gestion.qhalicare.com/privacy` |
| Condiciones del Servicio | `https://gestion.qhalicare.com/terms` |
