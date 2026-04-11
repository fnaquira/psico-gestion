import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTenantsView from "@/components/admin/AdminTenantsView";
import AdminUsersView from "@/components/admin/AdminUsersView";
import AdminPacientesView from "@/components/admin/AdminPacientesView";
import AdminCitasView from "@/components/admin/AdminCitasView";
import AdminPagosView from "@/components/admin/AdminPagosView";

export type AdminView = "consultorios" | "usuarios" | "pacientes" | "citas" | "pagos";

const VIEW_TITLES: Record<AdminView, string> = {
  consultorios: "Consultorios",
  usuarios: "Usuarios",
  pacientes: "Pacientes",
  citas: "Citas",
  pagos: "Pagos",
};

interface AdminPanelPageProps {
  onLogout: () => void;
}

export default function AdminPanelPage({ onLogout }: AdminPanelPageProps) {
  const [currentView, setCurrentView] = useState<AdminView>("usuarios");

  const renderView = () => {
    switch (currentView) {
      case "consultorios": return <AdminTenantsView />;
      case "usuarios": return <AdminUsersView />;
      case "pacientes": return <AdminPacientesView />;
      case "citas": return <AdminCitasView />;
      case "pagos": return <AdminPagosView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-8 py-3.5 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {VIEW_TITLES[currentView]}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Vista global del sistema</p>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
