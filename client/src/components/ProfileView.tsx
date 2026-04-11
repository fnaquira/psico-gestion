import React, { useState } from "react";
import { Camera, Save, User, Mail, Award, Building2, Globe, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { TIMEZONES, resolveTimezone } from "@/lib/timezones";

export default function ProfileView() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    nombre: user?.nombre ?? "",
    email: user?.email ?? "",
    especialidad: user?.especialidad ?? "",
    timezone: resolveTimezone(user?.timezone ?? "America/Lima"),
    logoUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", {
        nombre: form.nombre,
        email: form.email,
        especialidad: form.especialidad,
        timezone: form.timezone,
      });
      updateUser({
        nombre: data.nombre,
        email: data.email,
        especialidad: data.especialidad,
        timezone: data.timezone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.nombre
    ? form.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const ESPECIALIDADES = [
    { value: "clinica", label: "Psicología Clínica" },
    { value: "infantil", label: "Psicología Infantil" },
    { value: "educativa", label: "Psicología Educativa" },
    { value: "neuropsicologia", label: "Neuropsicología" },
    { value: "organizacional", label: "Psicología Organizacional" },
    { value: "otra", label: "Otra" },
  ];

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Información personal y configuración de cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
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
            <select
              value={form.especialidad}
              onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            >
              {ESPECIALIDADES.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zona Horaria */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Zona Horaria</h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Usada para sincronizar tus citas con Google Calendar correctamente.
          </p>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Globe size={12} />
              Zona horaria
            </label>
            <select
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

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
