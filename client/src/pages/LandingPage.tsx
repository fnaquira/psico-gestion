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
