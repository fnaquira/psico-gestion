import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Unlink,
  AlertCircle,
  Info,
} from "lucide-react";
import api from "@/lib/api";

interface GCalStatus {
  connected: boolean;
  syncEnabled?: boolean;
  calendarId?: string;
  connectedAt?: string;
}

interface Props {
  gcalStatus?: "success" | "error" | null;
  gcalErrorReason?: string | null;
}

export function GoogleCalendarSettings({ gcalStatus, gcalErrorReason }: Props) {
  const [status, setStatus] = useState<GCalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const { data } = await api.get<GCalStatus>("/google-calendar/status");
      setStatus(data);
    } catch {
      setError("Error al obtener estado de Google Calendar");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ url: string }>("/google-calendar/auth-url");
      window.location.href = data.url;
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? "No se pudo iniciar la vinculación con Google";
      setError(msg);
      setActionLoading(false);
    }
  }

  async function handleToggleSync() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await api.patch<{ syncEnabled: boolean }>(
        "/google-calendar/toggle-sync",
      );
      setStatus(prev => (prev ? { ...prev, syncEnabled: data.syncEnabled } : prev));
    } catch {
      setError("Error al cambiar el estado de sincronización");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (
      !confirm(
        "¿Desconectar Google Calendar? Las citas existentes no se eliminarán del calendario.",
      )
    )
      return;
    setActionLoading(true);
    setError(null);
    try {
      await api.delete("/google-calendar/disconnect");
      setStatus({ connected: false });
    } catch {
      setError("Error al desconectar");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando estado de Google Calendar…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Google Calendar</h3>
          <p className="text-xs text-muted-foreground">Sincroniza tus citas automáticamente</p>
        </div>
      </div>

      {/* OAuth result banner */}
      {gcalStatus === "success" && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Google Calendar vinculado correctamente.</span>
        </div>
      )}
      {gcalStatus === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No se pudo vincular Google Calendar
            {gcalErrorReason ? `: ${gcalErrorReason}` : ""}
          </span>
        </div>
      )}

      {/* Internal error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status?.connected ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Vinculado</span>
            {status.connectedAt && (
              <span className="text-muted-foreground">
                desde {new Date(status.connectedAt).toLocaleDateString("es-AR")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Sincronización automática</p>
              <p className="text-xs text-muted-foreground">
                {status.syncEnabled
                  ? "Las citas se sincronizan al crearlas o modificarlas"
                  : "Pausada — las nuevas citas no se sincronizarán"}
              </p>
            </div>
            <button
              onClick={handleToggleSync}
              disabled={actionLoading}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                status.syncEnabled ? "bg-primary" : "bg-input"
              }`}
              role="switch"
              aria-checked={status.syncEnabled}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  status.syncEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Unlink className="h-4 w-4" />
            Desconectar Google Calendar
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>No vinculado</span>
          </div>

          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Google para que cada cita que crees o modifiques se agregue
            automáticamente a tu Google Calendar.
          </p>

          <button
            onClick={handleConnect}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Conectar con Google Calendar
          </button>
        </>
      )}
    </div>
  );
}
