import { GoogleCalendarSettings } from "@/components/GoogleCalendarSettings";

interface Props {
  gcalStatus?: "success" | "error" | null;
  gcalErrorReason?: string | null;
}

export default function ConfiguracionView({ gcalStatus, gcalErrorReason }: Props) {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Integraciones y ajustes del sistema
        </p>
      </div>
      <GoogleCalendarSettings gcalStatus={gcalStatus} gcalErrorReason={gcalErrorReason} />
    </div>
  );
}
