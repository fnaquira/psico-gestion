import React from "react";
import { Building2, Users, UserRound, CalendarDays, CreditCard, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminView } from "@/pages/AdminPanelPage";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
}

const menuItems: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "consultorios", label: "Consultorios", icon: Building2 },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "pacientes", label: "Pacientes", icon: UserRound },
  { id: "citas", label: "Citas", icon: CalendarDays },
  { id: "pagos", label: "Pagos", icon: CreditCard },
];

export default function AdminSidebar({ currentView, onViewChange, onLogout }: AdminSidebarProps) {
  const { user } = useAuth();

  return (
    <div className="w-64 bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary/20 rounded-lg flex items-center justify-center border border-sidebar-primary/30 shrink-0">
            <ShieldCheck size={15} className="text-sidebar-primary" />
          </div>
          <div>
            <p
              className="text-sidebar-foreground text-[17px] font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              PsicoGestión
            </p>
            <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 font-medium tracking-wide uppercase">
              Admin
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-3">
          Sistema
        </p>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4 space-y-0.5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span className="text-sm font-medium">Salir</span>
        </button>
        <div className="w-full flex items-center gap-3 px-3 py-3 mt-1 bg-sidebar-accent/60 rounded-lg text-left">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/25 border border-sidebar-primary/30 flex items-center justify-center text-sidebar-primary text-xs font-bold shrink-0">
            {user?.nombre ? user.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "SA"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.nombre ?? "Super Admin"}</p>
            <p className="text-[11px] text-sidebar-foreground/45 truncate">superadmin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
