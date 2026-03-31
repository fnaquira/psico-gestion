import React, { useState } from 'react';
import { Plus, Search, Download, AlertCircle, X, CreditCard, History, TrendingDown } from 'lucide-react';

const transacciones = [
  { id: 1, paciente: 'Carlos Martínez', monto: 100, fecha: '30 Mar, 10:30', tipo: 'al_llegar', metodo: 'Efectivo', sesion: 'Seguimiento' },
  { id: 2, paciente: 'Laura Gómez', monto: 150, fecha: '30 Mar, 09:15', tipo: 'adelantado', metodo: 'Transferencia', sesion: 'Evaluación' },
  { id: 3, paciente: 'Ana López', monto: 400, fecha: '29 Mar, 14:00', tipo: 'adelantado', metodo: 'Tarjeta', sesion: '4 sesiones' },
  { id: 4, paciente: 'Roberto Silva', monto: 100, fecha: '28 Mar, 11:45', tipo: 'al_llegar', metodo: 'Efectivo', sesion: 'Seguimiento' },
];

const deudas = [
  { id: 1, paciente: 'María González', deuda: 300, maximo: 450, sesiones: 2, desde: '25 Mar' },
  { id: 2, paciente: 'Pedro Ruiz', deuda: 150, maximo: 450, sesiones: 1, desde: '20 Mar' },
];

const TIPO_BADGE: Record<string, string> = {
  adelantado: 'bg-accent text-accent-foreground',
  al_llegar: 'bg-emerald-50 text-emerald-700',
};

const TIPO_LABEL: Record<string, string> = {
  adelantado: 'Adelantado',
  al_llegar: 'Al Llegar',
};

const METODO_ICON: Record<string, string> = {
  Efectivo: '💵',
  Transferencia: '🏦',
  Tarjeta: '💳',
};

export default function PagosView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'registro' | 'historial' | 'deudas'>('registro');

  const filteredTrans = transacciones.filter(t =>
    t.paciente.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const filteredDeudas = deudas.filter(d =>
    d.paciente.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalDeuda = deudas.reduce((s, d) => s + d.deuda, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Pagos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestión de transacciones y deudas</p>
        </div>
        <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus size={17} strokeWidth={2.5} />
          Registrar Pago
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-muted p-1 rounded-xl w-fit">
        {([
          { id: 'registro', label: 'Registro Rápido', icon: CreditCard, count: null },
          { id: 'historial', label: 'Historial', icon: History, count: transacciones.length },
          { id: 'deudas', label: 'Deudas', icon: TrendingDown, count: deudas.length },
        ] as const).map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2 : 1.75} />
              {t.label}
              {t.count !== null && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? t.id === 'deudas' ? 'bg-red-50 text-red-600' : 'bg-accent text-accent-foreground'
                    : 'bg-background/60 text-muted-foreground'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* REGISTRO */}
      {tab === 'registro' && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-7 max-w-lg">
          <h3 className="text-sm font-semibold text-foreground mb-5">Registrar Pago</h3>
          <div className="space-y-5">
            <Field label="Paciente">
              <input
                type="text"
                placeholder="Buscar paciente..."
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </Field>
            <Field label="Monto">
              <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                <span className="px-3.5 py-2.5 bg-muted text-sm font-semibold text-muted-foreground border-r border-border">$</span>
                <input
                  type="number"
                  placeholder="0"
                  className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none bg-card tabular-nums"
                />
              </div>
            </Field>
            <Field label="Método de Pago">
              <select className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow">
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
              </select>
            </Field>
            <Field label="Tipo de Pago">
              <div className="space-y-2.5">
                {[
                  { value: 'al_llegar', label: 'Al Llegar', desc: 'Sesión de hoy' },
                  { value: 'adelantado', label: 'Adelantado', desc: 'Próximas sesiones' },
                  { value: 'deuda', label: 'Pago de Deuda', desc: 'Saldar deuda pendiente' },
                ].map((opt, i) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="tipo" defaultChecked={i === 0} className="w-4 h-4 accent-primary" />
                    <div>
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex gap-3 pt-1">
              <button className="flex-1 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                Registrar
              </button>
              <button className="flex-1 bg-muted text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted/70 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <div className="space-y-4">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por paciente..." />
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Paciente', 'Monto', 'Tipo', 'Método', 'Fecha', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrans.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-foreground">{t.paciente}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.sesion}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground tabular-nums">${t.monto}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_BADGE[t.tipo]}`}>
                        {TIPO_LABEL[t.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground">
                      <span className="mr-1.5">{METODO_ICON[t.metodo]}</span>
                      {t.metodo}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-medium">{t.fecha}</td>
                    <td className="px-5 py-4">
                      <button className="text-primary hover:text-primary/70 text-xs font-semibold flex items-center gap-1 transition-colors">
                        <Download size={12} strokeWidth={2} />
                        Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEUDAS */}
      {tab === 'deudas' && (
        <div className="space-y-4">
          {/* Summary alert */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={18} strokeWidth={2} />
            <div>
              <p className="font-semibold text-red-800 text-sm">Deudas Pendientes</p>
              <p className="text-xs text-red-600 mt-0.5">
                Total: <span className="font-bold tabular-nums">${totalDeuda}</span> · {deudas.length} pacientes
              </p>
            </div>
          </div>

          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar paciente..." />

          <div className="space-y-3">
            {filteredDeudas.map(d => (
              <div key={d.id} className="bg-card rounded-xl border border-border shadow-sm p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-foreground">{d.paciente}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.sesiones} sesión{d.sesiones > 1 ? 'es' : ''} · desde {d.desde}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-500 tabular-nums">${d.deuda}</p>
                    <button className="text-xs text-primary hover:text-primary/70 font-semibold mt-1 transition-colors">
                      Registrar Pago
                    </button>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5 font-medium">
                    <span>Deuda actual</span>
                    <span>{Math.round((d.deuda / d.maximo) * 100)}% del total acumulado</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${(d.deuda / d.maximo) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {filteredDeudas.length === 0 && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
                No se encontraron deudas para &ldquo;{searchTerm}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} strokeWidth={2} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
