import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';
import AuthLayout from '@/components/AuthLayout';

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  };

  return (
    <AuthLayout
      title="Recuperar Contraseña"
      subtitle="Te enviamos un enlace para restablecer tu acceso"
    >
      {sent ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">¡Correo enviado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Revisá tu bandeja de entrada en{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Si no aparece en bandeja, revisá spam.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-2"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-muted-foreground -mt-2">
            Ingresá el correo asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="doctor@clinica.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Mail size={17} />
            )}
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Volver al Inicio de Sesión
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
