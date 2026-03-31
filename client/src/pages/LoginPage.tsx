import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión. Verificá tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accedé a tu panel de PsicoGestión"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Correo electrónico">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="doctor@clinica.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </Field>

        <Field label="Contraseña">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-12 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-primary hover:text-primary/70 font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn size={17} />
          )}
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>

        <Divider />

        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-primary hover:text-primary/70 font-semibold transition-colors"
          >
            Registrarse
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">o</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
