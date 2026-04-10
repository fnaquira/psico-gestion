import type { ReactNode } from "react";
import { ExternalLink, CheckCircle2 } from "lucide-react";

interface Step {
  number: number;
  title: string;
  body: ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Crear un proyecto en Google Cloud Console",
    body: (
      <>
        <p>
          Ingresá a{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            console.cloud.google.com
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          y creá un proyecto nuevo (o usá uno existente).
        </p>
        <p className="mt-2">
          En la barra superior hacé clic en el selector de proyectos →{" "}
          <strong>Nuevo proyecto</strong> → ingresá un nombre (ej: "PsicoGestión") →{" "}
          <strong>Crear</strong>.
        </p>
      </>
    ),
  },
  {
    number: 2,
    title: "Habilitar la API de Google Calendar",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Biblioteca</strong>.
        </p>
        <p className="mt-2">
          Buscá <strong>Google Calendar API</strong> → hacé clic en el resultado →{" "}
          <strong>Habilitar</strong>.
        </p>
      </>
    ),
  },
  {
    number: 3,
    title: "Configurar la pantalla de consentimiento OAuth",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Pantalla de consentimiento OAuth</strong>.
        </p>
        <p className="mt-2">
          Seleccioná <strong>Externo</strong> → <strong>Crear</strong>. Completá el nombre
          de la app y tu email de soporte. En "Usuarios de prueba" agregá tu cuenta de Gmail.
          Guardá y continuá hasta completar todos los pasos.
        </p>
      </>
    ),
  },
  {
    number: 4,
    title: "Crear credenciales OAuth 2.0",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Credenciales</strong> → <strong>Crear credenciales</strong> →{" "}
          <strong>ID de cliente OAuth</strong>.
        </p>
        <p className="mt-2">
          Tipo de aplicación: <strong>Aplicación web</strong>.
        </p>
        <p className="mt-2">
          En <strong>URIs de redireccionamiento autorizados</strong>, agregá la URL que te
          indicó el administrador del sistema. Es la URL pública del servidor de PsicoGestión
          seguida de{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            /api/google-calendar/callback
          </code>
          .
        </p>
        <p className="mt-2">
          Hacé clic en <strong>Crear</strong>.
        </p>
      </>
    ),
  },
  {
    number: 5,
    title: "Copiar las credenciales a PsicoGestión",
    body: (
      <>
        <p>
          Google te mostrará una ventana con el <strong>ID de cliente</strong> y el{" "}
          <strong>Secreto de cliente</strong>.
        </p>
        <p className="mt-2">
          Copiá ambos valores y pegálos en los campos correspondientes de{" "}
          <strong>Configuración → Credenciales de Google OAuth</strong> en esta aplicación.
        </p>
        <p className="mt-2">
          Hacé clic en <strong>Guardar credenciales</strong> y después en{" "}
          <strong>Conectar con Google Calendar</strong>.
        </p>
      </>
    ),
  },
];

export default function ManualGCalView() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Manual de integración
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cómo obtener tus credenciales de Google para sincronizar el calendario
        </p>
      </div>

      {/* Intro */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground space-y-2">
        <p>
          PsicoGestión se conecta a tu Google Calendar usando tu propio proyecto de Google
          Cloud. Esto significa que vos controlás completamente el acceso: podés revocar el
          permiso en cualquier momento desde tu cuenta de Google.
        </p>
        <p>
          El proceso toma aproximadamente <strong>5 minutos</strong> y solo necesitás hacerlo
          una vez.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map(step => (
          <div
            key={step.number}
            className="bg-card rounded-xl border border-border shadow-sm p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold mt-0.5">
                {step.number}
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Done banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Una vez conectado, tus citas se sincronizarán automáticamente con Google Calendar
          cada vez que las crees o modifiques.
        </p>
      </div>
    </div>
  );
}
