import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import type { CitaDTO, UserDTO, PacienteDTO } from "@shared/types";

const TYPE_LABELS: Record<string, string> = {
  inicial: "Inicial",
  seguimiento: "Seguimiento",
  evaluacion: "Evaluación",
  otra: "Otra",
};

const TYPE_STYLES: Record<string, string> = {
  Inicial: "bg-emerald-50 border-emerald-200 text-emerald-800",
  Seguimiento: "bg-teal-50 border-teal-200 text-teal-800",
  Evaluación: "bg-amber-50 border-amber-200 text-amber-800",
  Otra: "bg-slate-50 border-slate-200 text-slate-800",
};

const STATUS_DOT: Record<string, string> = {
  programada: "bg-emerald-500",
  realizada: "bg-blue-500",
  cancelada: "bg-red-400",
  no_asistio: "bg-amber-400",
};

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
const LUNCH = "12:00";

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const EMPTY_FORM = {
  pacienteId: "",
  pacienteBusqueda: "",
  doctorId: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  tipoSesion: "seguimiento" as "inicial" | "seguimiento" | "evaluacion" | "otra",
  montoCita: "",
  notas: "",
};

export default function AgendaView() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [citas, setCitas] = useState<CitaDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaDTO | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Patient search for form
  const [pacientes, setPacientes] = useState<PacienteDTO[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const fecha = toDateStr(selectedDate);
      const [citasRes, docsRes] = await Promise.all([
        api.get<CitaDTO[]>("/citas", { params: { fecha } }),
        api.get<UserDTO[]>("/doctores"),
      ]);
      setCitas(citasRes.data);
      setDoctors(docsRes.data);
    } catch (err) {
      console.error("Error loading agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // Search pacientes for the form dropdown
  useEffect(() => {
    if (pacienteSearch.length < 2) {
      setPacientes([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/pacientes", {
          params: { search: pacienteSearch, limit: 5 },
        });
        setPacientes(res.data.data);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [pacienteSearch]);

  const navigateDate = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const dateStr = selectedDate.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build appointment grid: key = "doctorId-HH:MM"
  const appointmentMap = new Map<string, CitaDTO>();
  citas.forEach(c => {
    const key = `${c.doctorId}-${c.horaInicio}`;
    appointmentMap.set(key, c);
  });

  const openNewCita = (prefillDoctorId?: string, prefillTime?: string) => {
    setEditingCita(null);
    setForm({
      ...EMPTY_FORM,
      fecha: toDateStr(selectedDate),
      doctorId: prefillDoctorId ?? doctors[0]?._id ?? "",
      horaInicio: prefillTime ?? "",
      horaFin: prefillTime
        ? `${String(Number(prefillTime.split(":")[0]) + 1).padStart(2, "0")}:00`
        : "",
    });
    setPacienteSearch("");
    setDialogOpen(true);
  };

  const openEditCita = (cita: CitaDTO) => {
    setEditingCita(cita);
    const pacienteName = cita.paciente
      ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
      : "";
    setForm({
      pacienteId: cita.pacienteId,
      pacienteBusqueda: pacienteName,
      doctorId: cita.doctorId,
      fecha: cita.fecha.split("T")[0],
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      tipoSesion: cita.tipoSesion,
      montoCita: String(cita.montoCita),
      notas: cita.notas,
    });
    setPacienteSearch(pacienteName);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pacienteId || !form.doctorId || !form.horaInicio || !form.horaFin)
      return;

    setSubmitting(true);
    try {
      const body = {
        pacienteId: form.pacienteId,
        doctorId: form.doctorId,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        tipoSesion: form.tipoSesion,
        montoCita: Number(form.montoCita) || 0,
        notas: form.notas,
      };

      if (editingCita) {
        await api.put(`/citas/${editingCita._id}`, body);
      } else {
        await api.post("/citas", body);
      }
      setDialogOpen(false);
      fetchCitas();
    } catch (err) {
      console.error("Error saving cita:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (citaId: string) => {
    try {
      await api.delete(`/citas/${citaId}`);
      fetchCitas();
    } catch (err) {
      console.error("Error cancelling cita:", err);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Agenda
          </h2>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            {dateStr}
          </p>
        </div>
        <button
          onClick={() => openNewCita()}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={17} strokeWidth={2.5} />
          Nueva Cita
        </button>
      </div>

      {/* Date Nav */}
      <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-xl border border-border shadow-sm">
        <button
          onClick={() => navigateDate(-1)}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground"
        >
          <ChevronLeft size={17} strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold text-foreground flex-1 text-center capitalize">
          {dateStr}
        </span>
        <button
          onClick={() => navigateDate(1)}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground"
        >
          <ChevronRight size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No hay doctores registrados
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Doctor headers */}
          <div
            className="grid border-b border-border bg-muted/40"
            style={{
              gridTemplateColumns: `110px repeat(${doctors.length}, 1fr)`,
            }}
          >
            <div className="p-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Hora
            </div>
            {doctors.map(doc => (
              <div
                key={doc._id}
                className="p-4 border-l border-border flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {getInitials(doc.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm leading-tight">
                    {doc.nombre}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {doc.especialidad}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Slots */}
          {TIME_SLOTS.map(time => {
            const isLunch = time === LUNCH;
            return (
              <div
                key={time}
                className={`grid border-b border-border last:border-b-0 ${isLunch ? "bg-muted/30" : ""}`}
                style={{
                  gridTemplateColumns: `110px repeat(${doctors.length}, 1fr)`,
                }}
              >
                <div className="p-3 border-r border-border flex items-center">
                  <span
                    className={`text-xs font-medium tabular-nums ${isLunch ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {time}
                  </span>
                </div>
                {doctors.map(doc => {
                  const key = `${doc._id}-${time}`;
                  const appt = appointmentMap.get(key);
                  const typeLabel = appt
                    ? (TYPE_LABELS[appt.tipoSesion] ?? appt.tipoSesion)
                    : "";
                  const statusKey = appt?.estado ?? "";
                  return (
                    <div
                      key={key}
                      className={`p-2 border-l border-border min-h-[58px] ${isLunch ? "bg-muted/30" : "hover:bg-accent/30 cursor-pointer transition-colors"}`}
                      onClick={() => {
                        if (!isLunch && !appt) openNewCita(doc._id, time);
                      }}
                    >
                      {isLunch ? (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          Almuerzo
                        </span>
                      ) : appt ? (
                        <div
                          className={`p-2 rounded-lg text-xs border ${TYPE_STYLES[typeLabel] ?? "bg-muted border-border text-foreground"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[statusKey] ?? "bg-gray-400"}`}
                            />
                            <span className="font-semibold truncate">
                              {appt.paciente
                                ? `${appt.paciente.nombre} ${appt.paciente.apellido}`
                                : "—"}
                            </span>
                          </div>
                          <span className="opacity-70">{typeLabel}</span>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-[11px] text-muted-foreground">
                            + Cita
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-xs">
        {Object.entries(TYPE_STYLES).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded border ${cls}`} />
            <span className="text-muted-foreground font-medium">{type}</span>
          </div>
        ))}
        {Object.entries(STATUS_DOT).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${cls} inline-block`} />
            <span className="text-muted-foreground font-medium capitalize">
              {status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>

      {/* Citas del día */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-foreground text-sm">
            Citas del Día
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {citas.length} citas
          </span>
        </div>
        {citas.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No hay citas programadas para este día
          </div>
        ) : (
          <div className="divide-y divide-border">
            {citas.map(cita => {
              const typeLabel =
                TYPE_LABELS[cita.tipoSesion] ?? cita.tipoSesion;
              return (
                <div
                  key={cita._id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors"
                >
                  <Clock
                    size={15}
                    className="text-muted-foreground shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-semibold text-foreground w-12 shrink-0 tabular-nums">
                    {cita.horaInicio}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {cita.paciente
                        ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cita.doctor?.nombre ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_STYLES[typeLabel] ?? "bg-muted border-border text-foreground"}`}
                  >
                    {typeLabel}
                  </span>
                  <button
                    onClick={() => openEditCita(cita)}
                    className="text-primary hover:text-primary/70 text-xs font-semibold shrink-0 transition-colors"
                  >
                    Editar
                  </button>
                  {cita.estado !== "cancelada" && (
                    <button
                      onClick={() => handleCancel(cita._id)}
                      className="text-destructive hover:text-destructive/70 text-xs font-semibold shrink-0 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nueva / Editar Cita Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCita ? "Editar Cita" : "Nueva Cita"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paciente search */}
            <div className="relative">
              <label className="text-sm font-medium text-foreground">
                Paciente
              </label>
              <input
                type="text"
                value={pacienteSearch}
                onChange={e => {
                  setPacienteSearch(e.target.value);
                  setShowPacienteDropdown(true);
                  if (!e.target.value) {
                    setForm(f => ({ ...f, pacienteId: "" }));
                  }
                }}
                placeholder="Buscar paciente..."
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              {showPacienteDropdown && pacientes.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-auto">
                  {pacientes.map(p => (
                    <button
                      key={p._id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        setForm(f => ({ ...f, pacienteId: p._id }));
                        setPacienteSearch(`${p.nombre} ${p.apellido}`);
                        setShowPacienteDropdown(false);
                      }}
                    >
                      {p.nombre} {p.apellido}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Doctor
              </label>
              <select
                value={form.doctorId}
                onChange={e =>
                  setForm(f => ({ ...f, doctorId: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={e =>
                  setForm(f => ({ ...f, fecha: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={e =>
                    setForm(f => ({ ...f, horaInicio: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={form.horaFin}
                  onChange={e =>
                    setForm(f => ({ ...f, horaFin: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Tipo Sesion */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Tipo de Sesión
              </label>
              <select
                value={form.tipoSesion}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    tipoSesion: e.target.value as typeof form.tipoSesion,
                  }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="inicial">Inicial</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="evaluacion">Evaluación</option>
                <option value="otra">Otra</option>
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Monto
              </label>
              <input
                type="number"
                min="0"
                value={form.montoCita}
                onChange={e =>
                  setForm(f => ({ ...f, montoCita: e.target.value }))
                }
                placeholder="0"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Notas
              </label>
              <textarea
                value={form.notas}
                onChange={e =>
                  setForm(f => ({ ...f, notas: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !form.pacienteId}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : editingCita ? (
                  "Guardar"
                ) : (
                  "Crear Cita"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
