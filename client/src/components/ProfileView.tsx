import React, { useState, useEffect, useRef } from "react";
import { Camera, Save, User, Mail, Award, Building2, Loader2 } from "lucide-react";

interface ProfileData {
  nombre: string;
  email: string;
  especialidad: string;
  colegiatura: string;
  logoUrl: string;
}

const STORAGE_KEY = "psicogestion_profile";

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { nombre: "", email: "", especialidad: "", colegiatura: "", logoUrl: "" };
}

function saveProfile(data: ProfileData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface ProfileViewProps {
  onProfileUpdate?: (profile: ProfileData) => void;
}

export default function ProfileView({ onProfileUpdate }: ProfileViewProps) {
  const [form, setForm] = useState<ProfileData>(loadProfile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadProfile();
    setForm(stored);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setForm(f => ({ ...f, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    saveProfile(form);
    onProfileUpdate?.(form);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = form.nombre
    ? form.nombre
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Información personal y datos de colegiatura
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar / Logo */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Foto / Logo</h3>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary text-2xl font-bold">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera size={13} strokeWidth={2.5} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Sube una foto o logo de tu consultorio.</p>
              <p className="text-xs">JPG, PNG o GIF · máx. 2 MB</p>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, logoUrl: "" }))}
                  className="text-xs text-destructive hover:text-destructive/70 font-medium transition-colors"
                >
                  Eliminar imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Datos personales */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Datos Personales</h3>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <User size={12} />
              Nombre completo
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Dra. Ana García"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Mail size={12} />
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Building2 size={12} />
              Especialidad
            </label>
            <input
              type="text"
              value={form.especialidad}
              onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
              placeholder="Ej: Psicología Clínica"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>
        </div>

        {/* Colegiatura */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Colegiatura</h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Número de colegiatura del Colegio de Psicólogos del Perú (CPsP)
          </p>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Award size={12} />
              N° de Colegiatura
            </label>
            <input
              type="text"
              value={form.colegiatura}
              onChange={e => setForm(f => ({ ...f, colegiatura: e.target.value }))}
              placeholder="Ej: CPsP 12345"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={15} strokeWidth={2.5} />
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              ¡Guardado correctamente!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export { loadProfile };
export type { ProfileData };
