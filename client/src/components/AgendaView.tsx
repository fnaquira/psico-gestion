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

type CalendarView = "dia" | "semana" | "mes";

const TYPE_LABELS: Record<string, string> = {
  inicial: "Inicial",
  seguimiento: "Seguimiento",
  evaluacion: "Evaluación",
  terapia: "Terapia",
  consejeria: "Consejería",
  orientacion_vocacional: "Orientación Vocacional",
  otra: "Otra",
};

const TYPE_STYLES: Record<string, string> = {
  Inicial: "bg-emerald-50 border-emerald-200 text-emerald-800",
  Seguimiento: "bg-teal-50 border-teal-200 text-teal-800",
  Evaluación: "bg-amber-50 border-amber-200 text-amber-800",
  Terapia: "bg-blue-50 border-blue-200 text-blue-800",
  Consejería: "bg-violet-50 border-violet-200 text-violet-800",
  "Orientación Vocacional": "bg-orange-50 border-orange-200 text-orange-800",
  Otra: "bg-slate-50 border-slate-200 text-slate-800",
};

const TYPE_CHIP: Record<string, string> = {
  Inicial: "bg-emerald-100 text-emerald-800",
  Seguimiento: "bg-teal-100 text-teal-800",
  Evaluación: "bg-amber-100 text-amber-800",
  Terapia: "bg-blue-100 text-blue-800",
  Consejería: "bg-violet-100 text-violet-800",
  "Orientación Vocacional": "bg-orange-100 text-orange-800",
  Otra: "bg-slate-100 text-slate-800",
};

const STATUS_DOT: Record<string, string> = {
  programada: "bg-emerald-500",
  realizada: "bg-blue-500",
  cancelada: "bg-red-400",
  no_asistio: "bg-amber-400",
};

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00",
];
const LUNCH = "12:00";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/** Monday of the week containing `date` */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** First day of the month */
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Build 7-day array starting from a given Monday */
function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Build calendar grid (42 cells = 6 weeks) for a month */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const offsetMon = startDay === 0 ? 6 : startDay - 1;
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - offsetMon + i);
    grid.push(d);
  }
  return grid;
}

const EMPTY_FORM = {
  pacienteId: "",
  pacienteBusqueda: "",
  doctorId: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  tipoSesion: "seguimiento" as
    | "inicial" | "seguimiento" | "evaluacion"
    | "terapia" | "consejeria" | "orientacion_vocacional" | "otra",
  numeroSesion: "",
  montoCita: "",
  notas: "",
};

export default function AgendaView() {
  const [calView, setCalView] = useState<CalendarView>("dia");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [citas, setCitas] = useState<CitaDTO[]>([]);
  const [doctors, setDoctors] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaDTO | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [pacientes, setPacientes] = useState<PacienteDTO[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);

  // ---- Fetch helpers ----

  const fetchDoctors = useCallback(async () => {
    const res = await api.get<UserDTO[]>("/doctores");
    setDoctors(res.data);
  }, []);

  const fetchCitasRange = useCallback(async (desde: string, hasta: string) => {
    const res = await api.get<CitaDTO[]>("/citas", { params: { desde, hasta } });
    return res.data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let desde: string;
      let hasta: string;

      if (calView === "dia") {
        desde = toDateStr(selectedDate);
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        hasta = toDateStr(next);
      } else if (calView === "semana") {
        const mon = startOfWeek(selectedDate);
        const sun = new Date(mon);
        sun.setDate(sun.getDate() + 7);
        desde = toDateStr(mon);
        hasta = toDateStr(sun);
      } else {
        const first = startOfMonth(selectedDate);
        const last = new Date(first.getFullYear(), first.getMonth() + 1, 1);
        desde = toDateStr(first);
        hasta = toDateStr(last);
      }

      const [citasData] = await Promise.all([
        fetchCitasRange(desde, hasta),
        doctors.length === 0 ? fetchDoctors() : Promise.resolve(),
      ]);
      setCitas(citasData);
    } catch (err) {
      console.error("Error loading agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [calView, selectedDate, fetchCitasRange, fetchDoctors, doctors.length]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (pacienteSearch.length < 2) { setPacientes([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/pacientes", { params: { search: pacienteSearch, limit: 5 } });
        setPacientes(res.data.data);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [pacienteSearch]);

  // ---- Navigation ----

  const navigate = (dir: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      if (calView === "dia") d.setDate(d.getDate() + dir);
      else if (calView === "semana") d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  // ---- Label helpers ----

  const navLabel = () => {
    if (calView === "dia") {
      return selectedDate.toLocaleDateString("es-CL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    }
    if (calView === "semana") {
      const mon = startOfWeek(selectedDate);
      const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
      return `${mon.getDate()} ${MONTHS_ES[mon.getMonth()].slice(0, 3)} – ${sun.getDate()} ${MONTHS_ES[sun.getMonth()].slice(0, 3)} ${sun.getFullYear()}`;
    }
    return `${MONTHS_ES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  // ---- Cita helpers ----

  const citasForDate = (d: Date) => {
    const ds = toDateStr(d);
    return citas.filter(c => c.fecha.slice(0, 10) === ds);
  };

  const citasForDateAndDoctor = (d: Date, doctorId: string, time: string) => {
    const ds = toDateStr(d);
    return citas.find(
      c => c.fecha.slice(0, 10) === ds && c.doctorId === doctorId && c.horaInicio === time,
    );
  };

  // ---- Dialog ----

  const openNewCita = (prefillDate?: string, prefillDoctorId?: string, prefillTime?: string) => {
    setEditingCita(null);
    setForm({
      ...EMPTY_FORM,
      fecha: prefillDate ?? toDateStr(selectedDate),
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
    const name = cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : "";
    setForm({
      pacienteId: cita.pacienteId,
      pacienteBusqueda: name,
      doctorId: cita.doctorId,
      fecha: cita.fecha.split("T")[0],
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      tipoSesion: cita.tipoSesion,
      montoCita: String(cita.montoCita),
      notas: cita.notas,
      numeroSesion: String((cita as any).numeroSesion ?? ""),
    });
    setPacienteSearch(name);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pacienteId || !form.doctorId || !form.horaInicio || !form.horaFin) return;
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
        numeroSesion: form.numeroSesion ? Number(form.numeroSesion) : undefined,
      };
      if (editingCita) await api.put(`/citas/${editingCita._id}`, body);
      else await api.post("/citas", body);
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error("Error saving cita:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (citaId: string) => {
    try {
      await api.delete(`/citas/${citaId}`);
      loadData();
    } catch (err) {
      console.error("Error cancelling cita:", err);
    }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ---- Render views ----

  const renderDayGrid = (day: Date, docList: UserDTO[]) => {
    const appointmentMap = new Map<string, CitaDTO>();
    citasForDate(day).forEach(c => {
      appointmentMap.set(`${c.doctorId}-${c.horaInicio}`, c);
    });

    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div
          className="grid border-b border-border bg-muted/40"
          style={{ gridTemplateColumns: `110px repeat(${docList.length}, 1fr)` }}
        >
          <div className="p-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Hora</div>
          {docList.map(doc => (
            <div key={doc._id} className="p-4 border-l border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {getInitials(doc.nombre)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm leading-tight">{doc.nombre}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{doc.especialidad}</p>
              </div>
            </div>
          ))}
        </div>

        {TIME_SLOTS.map(time => {
          const isLunch = time === LUNCH;
          return (
            <div
              key={time}
              className={`grid border-b border-border last:border-b-0 ${isLunch ? "bg-muted/30" : ""}`}
              style={{ gridTemplateColumns: `110px repeat(${docList.length}, 1fr)` }}
            >
              <div className="p-3 border-r border-border flex items-center">
                <span className={`text-xs font-medium tabular-nums ${isLunch ? "text-muted-foreground" : "text-foreground"}`}>
                  {time}
                </span>
              </div>
              {docList.map(doc => {
                const appt = appointmentMap.get(`${doc._id}-${time}`);
                const typeLabel = appt ? (TYPE_LABELS[appt.tipoSesion] ?? appt.tipoSesion) : "";
                const statusKey = appt?.estado ?? "";
                return (
                  <div
                    key={doc._id}
                    className={`p-2 border-l border-border min-h-[58px] ${isLunch ? "bg-muted/30" : "hover:bg-accent/30 cursor-pointer transition-colors"}`}
                    onClick={() => { if (!isLunch && !appt) openNewCita(toDateStr(day), doc._id, time); }}
                  >
                    {isLunch ? (
                      <span className="text-[11px] text-muted-foreground/60 font-medium">Almuerzo</span>
                    ) : appt ? (
                      <div
                        className={`p-2 rounded-lg text-xs border cursor-pointer ${TYPE_STYLES[typeLabel] ?? "bg-muted border-border text-foreground"}`}
                        onClick={e => { e.stopPropagation(); openEditCita(appt); }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[statusKey] ?? "bg-gray-400"}`} />
                          <span className="font-semibold truncate">
                            {appt.paciente ? `${appt.paciente.nombre} ${appt.paciente.apellido}` : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-70">{typeLabel}</span>
                          {(appt as any).numeroSesion && (
                            <span className="opacity-60">· #{(appt as any).numeroSesion}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-muted-foreground">+ Cita</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const mon = startOfWeek(selectedDate);
    const days = weekDays(mon);

    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
        {/* Day headers */}
        <div className="grid border-b border-border bg-muted/40" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
          <div className="p-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Hora</div>
          {days.map((d, i) => {
            const isToday = toDateStr(d) === toDateStr(today);
            return (
              <div key={i} className="p-3 border-l border-border text-center">
                <p className={`text-[11px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {DAYS_ES[i]}
                </p>
                <p className={`text-lg font-bold leading-tight ${isToday ? "text-primary" : "text-foreground"}`}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {TIME_SLOTS.map(time => {
          const isLunch = time === LUNCH;
          return (
            <div
              key={time}
              className={`grid border-b border-border last:border-b-0 ${isLunch ? "bg-muted/30" : ""}`}
              style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
            >
              <div className="p-2 border-r border-border flex items-center">
                <span className={`text-xs font-medium tabular-nums ${isLunch ? "text-muted-foreground" : "text-foreground"}`}>
                  {time}
                </span>
              </div>
              {days.map((d, i) => {
                const citasSlot = isLunch
                  ? []
                  : citas.filter(c => c.fecha.slice(0, 10) === toDateStr(d) && c.horaInicio === time);
                return (
                  <div
                    key={i}
                    className={`p-1.5 border-l border-border min-h-[52px] ${isLunch ? "bg-muted/30" : "hover:bg-accent/20 cursor-pointer transition-colors"}`}
                    onClick={() => { if (!isLunch && citasSlot.length === 0) openNewCita(toDateStr(d), undefined, time); }}
                  >
                    {isLunch ? (
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                    ) : (
                      citasSlot.map(appt => {
                        const typeLabel = TYPE_LABELS[appt.tipoSesion] ?? appt.tipoSesion;
                        return (
                          <div
                            key={appt._id}
                            className={`px-1.5 py-1 rounded text-[10px] mb-0.5 cursor-pointer truncate ${TYPE_CHIP[typeLabel] ?? "bg-muted text-foreground"}`}
                            onClick={e => { e.stopPropagation(); openEditCita(appt); }}
                          >
                            <span className="font-semibold">
                              {appt.paciente ? `${appt.paciente.nombre} ${appt.paciente.apellido[0]}.` : "—"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const grid = monthGrid(year, month);

    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {DAYS_ES.map(d => (
            <div key={d} className="p-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const isCurrentMonth = d.getMonth() === month;
            const isToday = toDateStr(d) === toDateStr(today);
            const dayCitas = citasForDate(d);
            const maxVisible = 3;

            return (
              <div
                key={i}
                className={`min-h-[100px] p-2 border-b border-r border-border cursor-pointer transition-colors ${
                  isCurrentMonth ? "hover:bg-accent/20" : "bg-muted/20"
                } ${i % 7 === 6 ? "border-r-0" : ""} ${i >= grid.length - 7 ? "border-b-0" : ""}`}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDate(d);
                    setCalView("dia");
                  }
                }}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>

                {/* Citas chips */}
                <div className="space-y-0.5">
                  {dayCitas.slice(0, maxVisible).map(appt => {
                    const typeLabel = TYPE_LABELS[appt.tipoSesion] ?? appt.tipoSesion;
                    return (
                      <div
                        key={appt._id}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium ${TYPE_CHIP[typeLabel] ?? "bg-muted text-foreground"}`}
                        onClick={e => { e.stopPropagation(); openEditCita(appt); }}
                        title={appt.paciente ? `${appt.paciente.nombre} ${appt.paciente.apellido} · ${appt.horaInicio}` : ""}
                      >
                        {appt.horaInicio} {appt.paciente ? appt.paciente.nombre : "—"}
                      </div>
                    );
                  })}
                  {dayCitas.length > maxVisible && (
                    <p className="text-[10px] text-muted-foreground font-medium pl-1">
                      +{dayCitas.length - maxVisible} más
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- Day citas list (shown in dia + semana) ----

  const renderCitasList = () => {
    const listCitas = calView === "semana"
      ? citas
      : citasForDate(selectedDate);

    if (listCitas.length === 0) return null;

    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-foreground text-sm">
            {calView === "semana" ? "Citas de la Semana" : "Citas del Día"}
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {listCitas.length} citas
          </span>
        </div>
        <div className="divide-y divide-border">
          {listCitas.map(cita => {
            const typeLabel = TYPE_LABELS[cita.tipoSesion] ?? cita.tipoSesion;
            return (
              <div key={cita._id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                <Clock size={15} className="text-muted-foreground shrink-0" strokeWidth={1.75} />
                {calView === "semana" && (
                  <span className="text-xs text-muted-foreground w-10 shrink-0 tabular-nums">
                    {new Date(cita.fecha).toLocaleDateString("es-CL", { weekday: "short" })}
                  </span>
                )}
                <span className="text-sm font-semibold text-foreground w-12 shrink-0 tabular-nums">
                  {cita.horaInicio}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cita.doctor?.nombre ?? "—"}
                    {(cita as any).numeroSesion ? ` · Sesión #${(cita as any).numeroSesion}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_STYLES[typeLabel] ?? "bg-muted border-border text-foreground"}`}>
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
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Agenda</h2>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{navLabel()}</p>
        </div>
        <button
          onClick={() => openNewCita()}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={17} strokeWidth={2.5} />
          Nueva Cita
        </button>
      </div>

      {/* Nav bar + view switcher */}
      <div className="flex items-center gap-3">
        {/* View tabs */}
        <div className="flex gap-0.5 bg-muted p-1 rounded-xl">
          {(["dia", "semana", "mes"] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => setCalView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                calView === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1 text-center capitalize">
            {navLabel()}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Today button */}
        <button
          onClick={() => setSelectedDate(new Date(today))}
          className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          Hoy
        </button>
      </div>

      {/* Calendar content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No hay doctores registrados
        </div>
      ) : calView === "dia" ? (
        renderDayGrid(selectedDate, doctors)
      ) : calView === "semana" ? (
        renderWeekView()
      ) : (
        renderMonthView()
      )}

      {/* Legend */}
      {calView !== "mes" && (
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
      )}

      {/* Citas list */}
      {calView !== "mes" && renderCitasList()}

      {/* Nueva / Editar Cita Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCita ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paciente */}
            <div className="relative">
              <label className="text-sm font-medium text-foreground">Paciente</label>
              <input
                type="text"
                value={pacienteSearch}
                onChange={e => {
                  setPacienteSearch(e.target.value);
                  setShowPacienteDropdown(true);
                  if (!e.target.value) setForm(f => ({ ...f, pacienteId: "" }));
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
              <label className="text-sm font-medium text-foreground">Doctor</label>
              <select
                value={form.doctorId}
                onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="text-sm font-medium text-foreground">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Hora Inicio</label>
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Hora Fin</label>
                <input
                  type="time"
                  value={form.horaFin}
                  onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Tipo Sesión + Número Sesión */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Tipo de Sesión</label>
                <select
                  value={form.tipoSesion}
                  onChange={e => setForm(f => ({ ...f, tipoSesion: e.target.value as typeof form.tipoSesion }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="inicial">Inicial</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="evaluacion">Evaluación</option>
                  <option value="terapia">Terapia</option>
                  <option value="consejeria">Consejería</option>
                  <option value="orientacion_vocacional">Or. Vocacional</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">N° Sesión</label>
                <input
                  type="number"
                  min="1"
                  value={form.numeroSesion}
                  onChange={e => setForm(f => ({ ...f, numeroSesion: e.target.value }))}
                  placeholder="Ej: 5"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="text-sm font-medium text-foreground">Monto</label>
              <input
                type="number"
                min="0"
                value={form.montoCita}
                onChange={e => setForm(f => ({ ...f, montoCita: e.target.value }))}
                placeholder="0"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm font-medium text-foreground">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
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
