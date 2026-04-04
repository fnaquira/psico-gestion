import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Download,
  AlertCircle,
  X,
  CreditCard,
  History,
  TrendingDown,
} from "lucide-react";
import api from "../lib/api";
import type { PagoDTO, PacienteDTO } from "../../../shared/types";

interface DeudaItem {
  _id: string;
  nombre: string;
  telefono: string;
  deuda: number;
  desde: string;
  sesiones: number;
}

const TIPO_BADGE: Record<string, string> = {
  adelantado: "bg-accent text-accent-foreground",
  al_llegar: "bg-emerald-50 text-emerald-700",
  deuda: "bg-red-50 text-red-700",
};

const TIPO_LABEL: Record<string, string> = {
  adelantado: "Adelantado",
  al_llegar: "Al Llegar",
  deuda: "Deuda",
};

const METODO_ICON: Record<string, string> = {
  efectivo: "💵",
  transferencia: "🏦",
  tarjeta: "💳",
};

export default function PagosView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"registro" | "historial" | "deudas">(
    "registro",
  );

  const [transacciones, setTransacciones] = useState<PagoDTO[]>([]);
  const [deudas, setDeudas] = useState<DeudaItem[]>([]);
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingDeudas, setLoadingDeudas] = useState(false);

  // Registro form state
  const [form, setForm] = useState({
    pacienteId: "",
    pacienteBusqueda: "",
    monto: "",
    metodo: "efectivo" as "efectivo" | "transferencia" | "tarjeta",
    tipoPago: "al_llegar" as "al_llegar" | "adelantado" | "deuda",
    notas: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Patient search
  const [pacienteResults, setPacienteResults] = useState<PacienteDTO[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (form.pacienteBusqueda.length < 2) {
      setPacienteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/pacientes", {
          params: { search: form.pacienteBusqueda, limit: 5 },
        });
        setPacienteResults(data.data);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.pacienteBusqueda]);

  const fetchHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const { data } = await api.get("/pagos", {
        params: { search: searchTerm, limit: 30 },
      });
      setTransacciones(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistorial(false);
    }
  }, [searchTerm]);

  const fetchDeudas = useCallback(async () => {
    setLoadingDeudas(true);
    try {
      const { data } = await api.get("/pagos/deudas");
      setDeudas(data.data);
      setTotalDeuda(data.totalDeuda);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeudas(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "historial") fetchHistorial();
    if (tab === "deudas") fetchDeudas();
  }, [tab, fetchHistorial, fetchDeudas]);

  const resetForm = () => {
    setForm({
      pacienteId: "",
      pacienteBusqueda: "",
      monto: "",
      metodo: "efectivo",
      tipoPago: "al_llegar",
      notas: "",
    });
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pacienteId) {
      setSubmitError("Selecciona un paciente primero.");
      return;
    }
    if (!form.monto || parseFloat(form.monto) <= 0) {
      setSubmitError("Ingresa un monto válido.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      await api.post("/pagos", {
        pacienteId: form.pacienteId,
        monto: parseFloat(form.monto),
        metodo: form.metodo,
        tipoPago: form.tipoPago,
        notas: form.notas,
      });
      setSubmitSuccess(true);
      resetForm();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.error ?? "Error al registrar el pago",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const prefillDeuda = (deuda: DeudaItem) => {
    setForm({
      pacienteId: deuda._id,
      pacienteBusqueda: deuda.nombre,
      monto: String(deuda.deuda),
      metodo: "efectivo",
      tipoPago: "deuda",
      notas: `Pago de deuda - ${deuda.nombre}`,
    });
    setTab("registro");
  };

  const filteredDeudas = deudas.filter(d =>
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Pagos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de transacciones y deudas
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setTab("registro");
          }}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={17} strokeWidth={2.5} />
          Registrar Pago
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-muted p-1 rounded-xl w-fit">
        {(
          [
            {
              id: "registro",
              label: "Registro Rápido",
              icon: CreditCard,
              count: null,
            },
            {
              id: "historial",
              label: "Historial",
              icon: History,
              count: transacciones.length || null,
            },
            {
              id: "deudas",
              label: "Deudas",
              icon: TrendingDown,
              count: deudas.length || null,
            },
          ] as const
        ).map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2 : 1.75} />
              {t.label}
              {t.count !== null && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? t.id === "deudas"
                        ? "bg-red-50 text-red-600"
                        : "bg-accent text-accent-foreground"
                      : "bg-background/60 text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* REGISTRO */}
      {tab === "registro" && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-7 max-w-lg">
          <h3 className="text-sm font-semibold text-foreground mb-5">
            Registrar Pago
          </h3>
          <form onSubmit={handleRegistrar} className="space-y-5">
            {/* Patient search */}
            <Field label="Paciente">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre..."
                  value={form.pacienteBusqueda}
                  onChange={e => {
                    setForm(f => ({
                      ...f,
                      pacienteBusqueda: e.target.value,
                      pacienteId: "",
                    }));
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                {form.pacienteId && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-medium">
                    Seleccionado
                  </span>
                )}
                {showDropdown && pacienteResults.length > 0 && !form.pacienteId && (
                  <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-auto">
                    {pacienteResults.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            pacienteId: p._id,
                            pacienteBusqueda: `${p.nombre} ${p.apellido}`,
                          }));
                          setShowDropdown(false);
                        }}
                      >
                        <span className="font-medium">
                          {p.nombre} {p.apellido}
                        </span>
                        {p.estado === "en_deuda" && (
                          <span className="ml-2 text-xs text-red-500">
                            (en deuda)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Monto">
              <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                <span className="px-3.5 py-2.5 bg-muted text-sm font-semibold text-muted-foreground border-r border-border">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={form.monto}
                  onChange={e =>
                    setForm(f => ({ ...f, monto: e.target.value }))
                  }
                  required
                  className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none bg-card tabular-nums"
                />
              </div>
            </Field>
            <Field label="Método de Pago">
              <select
                value={form.metodo}
                onChange={e =>
                  setForm(f => ({ ...f, metodo: e.target.value as any }))
                }
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </Field>
            <Field label="Tipo de Pago">
              <div className="space-y-2.5">
                {[
                  {
                    value: "al_llegar",
                    label: "Al Llegar",
                    desc: "Sesión de hoy",
                  },
                  {
                    value: "adelantado",
                    label: "Adelantado",
                    desc: "Próximas sesiones",
                  },
                  {
                    value: "deuda",
                    label: "Pago de Deuda",
                    desc: "Saldar deuda pendiente",
                  },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={opt.value}
                      checked={form.tipoPago === opt.value}
                      onChange={() =>
                        setForm(f => ({ ...f, tipoPago: opt.value as any }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {opt.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Notas (opcional)">
              <textarea
                value={form.notas}
                onChange={e =>
                  setForm(f => ({ ...f, notas: e.target.value }))
                }
                rows={2}
                placeholder="Notas sobre el pago..."
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow resize-none"
              />
            </Field>
            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                Pago registrado exitosamente
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {submitting ? "Registrando..." : "Registrar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-muted text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted/70 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORIAL */}
      {tab === "historial" && (
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por paciente..."
          />
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {loadingHistorial ? (
              <div className="flex items-center justify-center py-12">
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {[
                      "Paciente",
                      "Monto",
                      "Tipo",
                      "Método",
                      "Fecha",
                      "",
                    ].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transacciones.map(t => {
                    const pac = t.paciente as any;
                    const nombre = pac
                      ? `${pac.nombre} ${pac.apellido}`
                      : "—";
                    return (
                      <tr
                        key={t._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">
                            {nombre}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-foreground tabular-nums">
                          ${t.monto.toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_BADGE[t.tipoPago]}`}
                          >
                            {TIPO_LABEL[t.tipoPago]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          <span className="mr-1.5">
                            {METODO_ICON[t.metodo]}
                          </span>
                          {t.metodo.charAt(0).toUpperCase() + t.metodo.slice(1)}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground font-medium">
                          {new Date(t.fechaPago).toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <button className="text-primary hover:text-primary/70 text-xs font-semibold flex items-center gap-1 transition-colors">
                            <Download size={12} strokeWidth={2} />
                            Recibo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {transacciones.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-muted-foreground"
                      >
                        No hay transacciones registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* DEUDAS */}
      {tab === "deudas" && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle
              className="text-red-500 shrink-0"
              size={18}
              strokeWidth={2}
            />
            <div>
              <p className="font-semibold text-red-800 text-sm">
                Deudas Pendientes
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Total:{" "}
                <span className="font-bold tabular-nums">
                  ${totalDeuda.toLocaleString()}
                </span>{" "}
                · {deudas.length} pacientes
              </p>
            </div>
          </div>

          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar paciente..."
          />

          {loadingDeudas ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeudas.map(d => (
                <div
                  key={d._id}
                  className="bg-card rounded-xl border border-border shadow-sm p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {d.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.sesiones} sesión{d.sesiones > 1 ? "es" : ""} · desde{" "}
                        {new Date(d.desde).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-500 tabular-nums">
                        ${d.deuda.toLocaleString()}
                      </p>
                      <button
                        onClick={() => prefillDeuda(d)}
                        className="text-xs text-primary hover:text-primary/70 font-semibold mt-1 transition-colors"
                      >
                        Registrar Pago
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDeudas.length === 0 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center text-sm text-muted-foreground">
                  {searchTerm
                    ? `No se encontraron deudas para "${searchTerm}"`
                    : "No hay deudas pendientes"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={15}
        strokeWidth={2}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
