// client/src/pages/TermsOfServicePage.tsx
import { useEffect } from 'react';
import PublicLayout from '@/components/PublicLayout';

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

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = 'Términos de Servicio · QhaliCare Gestión';
  }, []);

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
