import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import AgendaView from '@/components/AgendaView';
import PacientesView from '@/components/PacientesView';
import PagosView from '@/components/PagosView';

type ViewType = 'dashboard' | 'agenda' | 'pacientes' | 'pagos';

const VIEW_TITLES: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen del día' },
  agenda: { title: 'Agenda', subtitle: 'Citas y disponibilidad' },
  pacientes: { title: 'Pacientes', subtitle: 'Gestión de pacientes' },
  pagos: { title: 'Pagos', subtitle: 'Transacciones y deudas' },
};

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const today = new Date(2026, 2, 30);
  const formattedDate = today.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { title, subtitle } = VIEW_TITLES[currentView];

  const renderView = () => {
    switch (currentView) {
      case 'agenda': return <AgendaView />;
      case 'pacientes': return <PacientesView />;
      case 'pagos': return <PagosView />;
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
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <Bell size={18} strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>
            <div className="w-px h-5 bg-border" />
            <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
