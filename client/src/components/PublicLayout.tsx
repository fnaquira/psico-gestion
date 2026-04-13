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

          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-6 text-sm text-muted-foreground"
          >
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
            <p>
              Arequipa, Perú ·{' '}
              <a
                href="mailto:privacidad@qhalicare.com"
                className="hover:text-foreground transition-colors"
              >
                privacidad@qhalicare.com
              </a>
            </p>
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
