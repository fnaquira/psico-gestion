import React, { useState, useEffect } from 'react';
import { AlertCircle, CalendarDays, Clock, RefreshCw, Users } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import AgendaView from '@/components/AgendaView';
import PacientesView from '@/components/PacientesView';
import PagosView from '@/components/PagosView';
import ProfileView from '@/components/ProfileView';
import ConfiguracionView from '@/components/ConfiguracionView';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { DashboardStats } from '@shared/types';

type ViewType = 'dashboard' | 'agenda' | 'pacientes' | 'pagos' | 'perfil' | 'configuracion';

const VIEW_TITLES: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Tablero', subtitle: 'Resumen del día' },
  agenda: { title: 'Agenda', subtitle: 'Citas y disponibilidad' },
  pacientes: { title: 'Pacientes', subtitle: 'Gestión de pacientes' },
  pagos: { title: 'Pagos', subtitle: 'Transacciones y deudas' },
  perfil: { title: 'Mi Perfil', subtitle: 'Configuración de cuenta' },
  configuracion: { title: 'Configuración', subtitle: 'Integraciones y ajustes' },
};

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryStats, setSummaryStats] = useState<DashboardStats | null>(null);
  const [gcalStatus, setGcalStatus] = useState<"success" | "error" | null>(null);
  const [gcalErrorReason, setGcalErrorReason] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const gcal = params.get("gcal") as "success" | "error" | null;
    const reason = params.get("reason");

    if (view === "configuracion") {
      setCurrentView("configuracion");
      if (gcal === "success" || gcal === "error") {
        setGcalStatus(gcal);
        setGcalErrorReason(reason);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!gcalStatus) return;
    const t = setTimeout(() => {
      setGcalStatus(null);
      setGcalErrorReason(null);
    }, 6000);
    return () => clearTimeout(t);
  }, [gcalStatus]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { title, subtitle } = VIEW_TITLES[currentView];

  const openSummary = async () => {
    if (currentView !== 'dashboard') {
      return;
    }

    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryError('');

    try {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      setSummaryStats(response.data);
    } catch (error) {
      console.error('Error loading daily summary:', error);
      setSummaryError('No se pudo cargar el resumen del día.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'agenda': return <AgendaView />;
      case 'pacientes': return <PacientesView />;
      case 'pagos': return <PagosView />;
      case 'perfil': return <ProfileView />;
      case 'configuracion':
        return (
          <ConfiguracionView
            gcalStatus={gcalStatus}
            gcalErrorReason={gcalErrorReason}
          />
        );
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-8 py-3.5 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            {currentView === 'dashboard' ? (
              <button
                type="button"
                onClick={openSummary}
                className="text-xs text-muted-foreground font-medium rounded-md px-2.5 py-1.5 hover:bg-muted hover:text-foreground transition-colors"
              >
                {subtitle}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Resumen del día</DialogTitle>
            <DialogDescription className="capitalize">{formattedDate}</DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : summaryError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center space-y-3">
                <p className="text-sm text-destructive">{summaryError}</p>
                <Button type="button" variant="outline" onClick={openSummary}>
                  Reintentar
                </Button>
              </div>
            ) : summaryStats ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard
                    icon={<CalendarDays size={16} />}
                    label="Citas de hoy"
                    value={String(summaryStats.citasHoy)}
                    detail={`${summaryStats.citasHoyPendientes} en la próxima hora`}
                  />
                  <SummaryCard
                    icon={<Users size={16} />}
                    label="Pacientes activos"
                    value={String(summaryStats.pacientesActivos)}
                    detail={`${summaryStats.pacientesNuevosMes} nuevos este mes`}
                  />
                  <SummaryCard
                    icon={<AlertCircle size={16} />}
                    label="Alertas"
                    value={String(summaryStats.alertas.length)}
                    detail={`${summaryStats.pacientesEnDeuda} pacientes en deuda`}
                  />
                </div>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Citas del día</h3>
                    <span className="text-xs text-muted-foreground">{summaryStats.citasDelDia.length} registradas</span>
                  </div>
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {summaryStats.citasDelDia.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No hay citas programadas para hoy.
                      </p>
                    ) : (
                      summaryStats.citasDelDia.map((cita, index) => (
                        <div key={`${cita.hora}-${cita.paciente}-${index}`} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{cita.paciente}</p>
                            <p className="text-xs text-muted-foreground mt-1">{cita.tipo} con {cita.doctor}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                              <Clock size={14} />
                              {cita.hora}
                            </span>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {cita.estado}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Alertas y seguimiento</h3>
                  <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {summaryStats.alertas.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No hay alertas pendientes por hoy.
                      </p>
                    ) : (
                      summaryStats.alertas.map((alerta, index) => (
                        <div key={`${alerta.tipo}-${index}`} className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{alerta.detalle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alerta.mensaje}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
