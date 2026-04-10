import { useState, useEffect, type FormEvent } from "react";
import {
  Settings2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { GoogleCalendarSettings } from "@/components/GoogleCalendarSettings";

interface Props {
  gcalStatus?: "success" | "error" | null;
  gcalErrorReason?: string | null;
  onNavigateToManual: () => void;
}

export default function ConfiguracionView({
  gcalStatus,
  gcalErrorReason,
  onNavigateToManual,
}: Props) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    api
      .get<{ configured: boolean }>("/google-calendar/credentials")
      .then(r => setCredentialsConfigured(r.data.configured))
      .catch(() => {})
      .finally(() => setLoadingCredentials(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put("/google-calendar/credentials", { clientId, clientSecret });
      setCredentialsConfigured(true);
      setClientId("");
      setClientSecret("");
      setSaveMsg({ type: "success", text: "Credenciales guardadas correctamente" });
    } catch {
      setSaveMsg({ type: "error", text: "Error al guardar las credenciales" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Integraciones y ajustes del sistema
        </p>
      </div>

      {/* Card 1: Credentials */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Credenciales de Google OAuth
            </h3>
            <p className="text-xs text-muted-foreground">
              Requeridas para conectar Google Calendar
            </p>
          </div>
        </div>

        {!loadingCredentials && credentialsConfigured && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Credenciales configuradas</span>
            <span className="text-muted-foreground">
              — podés actualizarlas ingresando nuevos valores
            </span>
          </div>
        )}

        {saveMsg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              saveMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {saveMsg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="123456789-abc.apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder="GOCSPX-…"
                className="w-full px-3.5 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showSecret ? "Ocultar secreto" : "Mostrar secreto"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !clientId.trim() || !clientSecret.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando…" : "Guardar credenciales"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground">
          ¿No sabés cómo obtener estas credenciales?{" "}
          <button
            type="button"
            onClick={onNavigateToManual}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            Ver el Manual de integración
            <ExternalLink className="h-3 w-3" />
          </button>
        </p>
      </div>

      {/* Card 2: GCal connection */}
      {!loadingCredentials &&
        (credentialsConfigured ? (
          <GoogleCalendarSettings
            gcalStatus={gcalStatus}
            gcalErrorReason={gcalErrorReason}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Primero guardá tus credenciales de Google para poder conectar tu calendario.
            </p>
          </div>
        ))}
    </div>
  );
}
