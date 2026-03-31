import React from 'react';
import { HeartPulse } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/60 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl shadow-foreground/6 border border-border p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 bg-sidebar rounded-xl flex items-center justify-center mb-4 border border-sidebar-primary/30">
              <HeartPulse size={20} className="text-sidebar-primary" />
            </div>
            <p
              className="text-2xl font-semibold text-foreground leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              PsicoGestión
            </p>
            <h1 className="text-sm font-semibold text-foreground mt-2">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          PsicoGestión · Sistema de Gestión de Consultorios
        </p>
      </div>
    </div>
  );
}
