import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useLocation } from 'wouter';
import AuthLayout from '@/components/AuthLayout';

interface RegisterPageProps {
  onLogin: () => void;
}

export default function RegisterPage({ onLogin }: RegisterPageProps) {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    especialidad: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Registrá tu consultorio en PsicoGestión"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre completo">
          <input
            type="text"
            value={form.nombre}
            onChange={set('nombre')}
            placeholder="Dr. Juan Pérez"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </Field>

        <Field label="Correo electrónico">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="doctor@clinica.com"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </Field>

        <Field label="Especialidad">
          <select
            value={form.especialidad}
            onChange={set('especialidad')}
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow bg-white"
          >
            <option value="">Seleccioná tu especialidad</option>
            <option>Psicología Clínica</option>
            <option>Psicología Infantil</option>
            <option>Psicología Educativa</option>
            <option>Neuropsicología</option>
            <option>Psicología Organizacional</option>
            <option>Otra</option>
          </select>
        </Field>

        <Field label="Contraseña">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="w-full px-4 py-3 pr-12 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar contraseña">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Repetí la contraseña"
            required
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </Field>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus size={17} />
          )}
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>

        <p className="text-center text-sm text-muted-foreground pt-1">
          ¿Ya tenés cuenta?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary/70 font-semibold transition-colors"
          >
            Iniciar Sesión
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
