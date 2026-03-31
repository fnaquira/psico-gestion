import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

const TYPE_STYLES: Record<string, string> = {
  Inicial: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Seguimiento: 'bg-teal-50 border-teal-200 text-teal-800',
  Evaluación: 'bg-amber-50 border-amber-200 text-amber-800',
};

const STATUS_DOT: Record<string, string> = {
  confirmada: 'bg-emerald-500',
  pendiente: 'bg-amber-400',
};

export default function AgendaView() {
  const [selectedDate] = useState(new Date(2026, 2, 30));

  const doctors = [
    { id: 1, name: 'Dr. Juan Pérez', specialty: 'Psicología Clínica', initials: 'JP' },
    { id: 2, name: 'Dra. María López', specialty: 'Psicología Infantil', initials: 'ML' },
    { id: 3, name: 'Dr. Carlos Ruiz', specialty: 'Psicología Educativa', initials: 'CR' },
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const lunch = '12:00';

  const appointments: Record<string, { patient: string; type: string; status: string }> = {
    '1-09:00': { patient: 'Ana Silva', type: 'Inicial', status: 'confirmada' },
    '1-10:00': { patient: 'Carlos Martínez', type: 'Seguimiento', status: 'confirmada' },
    '2-11:00': { patient: 'Laura Gómez', type: 'Evaluación', status: 'confirmada' },
    '3-14:00': { patient: 'Roberto Silva', type: 'Seguimiento', status: 'pendiente' },
  };

  const dateStr = selectedDate.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const citasDelDia = [
    { time: '09:00', patient: 'Ana Silva', doctor: 'Dr. Pérez', type: 'Inicial' },
    { time: '10:00', patient: 'Carlos Martínez', doctor: 'Dr. Pérez', type: 'Seguimiento' },
    { time: '11:00', patient: 'Laura Gómez', doctor: 'Dra. López', type: 'Evaluación' },
    { time: '14:00', patient: 'Roberto Silva', doctor: 'Dr. Ruiz', type: 'Seguimiento' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Agenda</h2>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{dateStr}</p>
        </div>
        <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus size={17} strokeWidth={2.5} />
          Nueva Cita
        </button>
      </div>

      {/* Date Nav */}
      <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-xl border border-border shadow-sm">
        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground">
          <ChevronLeft size={17} strokeWidth={2} />
        </button>
        <span className="text-sm font-semibold text-foreground flex-1 text-center capitalize">{dateStr}</span>
        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground">
          <ChevronRight size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Doctor headers */}
        <div className="grid grid-cols-[110px_repeat(3,1fr)] border-b border-border bg-muted/40">
          <div className="p-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Hora</div>
          {doctors.map(doc => (
            <div key={doc.id} className="p-4 border-l border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {doc.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm leading-tight">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{doc.specialty}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Slots */}
        {timeSlots.map(time => {
          const isLunch = time === lunch;
          return (
            <div key={time} className={`grid grid-cols-[110px_repeat(3,1fr)] border-b border-border last:border-b-0 ${isLunch ? 'bg-muted/30' : ''}`}>
              <div className="p-3 border-r border-border flex items-center">
                <span className={`text-xs font-medium tabular-nums ${isLunch ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {time}
                </span>
              </div>
              {doctors.map(doc => {
                const key = `${doc.id}-${time}`;
                const appt = appointments[key];
                return (
                  <div
                    key={key}
                    className={`p-2 border-l border-border min-h-[58px] ${isLunch ? 'bg-muted/30' : 'hover:bg-accent/30 cursor-pointer transition-colors'}`}
                  >
                    {isLunch ? (
                      <span className="text-[11px] text-muted-foreground/60 font-medium">Almuerzo</span>
                    ) : appt ? (
                      <div className={`p-2 rounded-lg text-xs border ${TYPE_STYLES[appt.type] ?? 'bg-muted border-border text-foreground'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[appt.status]}`} />
                          <span className="font-semibold truncate">{appt.patient}</span>
                        </div>
                        <span className="opacity-70">{appt.type}</span>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-xs">
        {Object.entries(TYPE_STYLES).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded border ${cls}`} />
            <span className="text-muted-foreground font-medium">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-muted-foreground font-medium">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-muted-foreground font-medium">Pendiente</span>
        </div>
      </div>

      {/* Citas del día */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold text-foreground text-sm">Citas del Día</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {citasDelDia.length} citas
          </span>
        </div>
        <div className="divide-y divide-border">
          {citasDelDia.map((cita, idx) => (
            <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
              <Clock size={15} className="text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-foreground w-12 shrink-0 tabular-nums">{cita.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{cita.patient}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cita.doctor}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_STYLES[cita.type] ?? 'bg-muted border-border text-foreground'}`}>
                {cita.type}
              </span>
              <button className="text-primary hover:text-primary/70 text-xs font-semibold shrink-0 transition-colors">
                Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
