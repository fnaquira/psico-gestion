import { useEffect, type ReactNode } from 'react';
import PublicLayout from '@/components/PublicLayout';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Política de Privacidad · QhaliCare Gestión';
  }, []);
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
              target="_blank"
              rel="noopener noreferrer"
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
