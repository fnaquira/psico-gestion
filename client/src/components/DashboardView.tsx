import React from 'react';
import { AlertCircle, Clock, TrendingUp, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const weeklyIncome = [
  { dia: 'Lun', monto: 450 },
  { dia: 'Mar', monto: 620 },
  { dia: 'Mié', monto: 380 },
  { dia: 'Jue', monto: 710 },
  { dia: 'Vie', monto: 540 },
  { dia: 'Sáb', monto: 290 },
  { dia: 'Hoy', monto: 420 },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['bg-teal-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];

const citasDelDia = [
  { time: '10:00', patient: 'Carlos Martínez', type: 'Seguimiento', doctor: 'Dr. Pérez', status: 'Confirmada' },
  { time: '11:00', patient: 'Laura Gómez', type: 'Inicial', doctor: 'Dra. López', status: 'Confirmada' },
  { time: '14:00', patient: 'Roberto Silva', type: 'Evaluación', doctor: 'Dr. Pérez', status: 'Pendiente' },
];

export default function DashboardView() {
  return (
    <div className="p-8 space-y-7">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Citas Hoy"
          value="8"
          sub="2 en la próxima hora"
          icon={<Clock size={19} strokeWidth={1.75} />}
          iconBg="bg-primary/8"
          iconColor="text-primary"
          trend="+2 vs. ayer"
          trendUp
        />
        <StatCard
          label="Pacientes Activos"
          value="24"
          sub="3 nuevos este mes"
          icon={<Users size={19} strokeWidth={1.75} />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          trend="+3 este mes"
          trendUp
        />
        <StatCard
          label="Ingresos Mes"
          value="$4,200"
          sub="+12% vs. mes anterior"
          icon={<TrendingUp size={19} strokeWidth={1.75} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend="+12%"
          trendUp
        />
        <StatCard
          label="Deudas Pendientes"
          value="$850"
          sub="5 pacientes en deuda"
          icon={<AlertCircle size={19} strokeWidth={1.75} />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          trend="+$150 esta semana"
          trendUp={false}
          valueColor="text-red-500"
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Weekly income chart */}
        <div className="xl:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Ingresos — Últimos 7 días</h3>
              <p className="text-xs text-muted-foreground mt-1">Total semana: $3,410</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <TrendingUp size={11} strokeWidth={2.5} /> +8.4%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={156}>
            <BarChart data={weeklyIncome} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fill: '#8a8680', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8a8680', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`$${value}`, 'Ingresos']}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e7e3de',
                  fontSize: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
                cursor={{ fill: 'oklch(0.955 0.007 80)' }}
              />
              <Bar dataKey="monto" radius={[5, 5, 0, 0]}>
                {weeklyIncome.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.dia === 'Hoy' ? '#0d9488' : '#b8e4e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-2.5">
          <h3 className="font-semibold text-foreground text-sm mb-1">Alertas recientes</h3>
          <AlertItem
            color="red"
            icon={<AlertCircle size={14} strokeWidth={2} />}
            title="Deuda pendiente"
            desc="María González — $300 · 2 sesiones"
          />
          <AlertItem
            color="blue"
            icon={<Clock size={14} strokeWidth={2} />}
            title="Cita en 45 min"
            desc="Carlos Martínez — Seguimiento"
          />
          <AlertItem
            color="green"
            icon={<CheckCircle2 size={14} strokeWidth={2} />}
            title="Pago adelantado"
            desc="Ana López — $200 por 4 sesiones"
          />
          <AlertItem
            color="red"
            icon={<AlertCircle size={14} strokeWidth={2} />}
            title="Deuda pendiente"
            desc="Pedro Ruiz — $150 · 1 sesión"
          />
        </div>
      </div>

      {/* Upcoming appointments */}
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
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                {getInitials(cita.patient)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{cita.patient}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cita.type} · {cita.doctor}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-foreground tabular-nums">{cita.time}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  cita.status === 'Confirmada'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {cita.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, iconBg, iconColor, trend, trendUp, valueColor = 'text-foreground',
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendUp: boolean;
  valueColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      <div className="flex justify-between items-center mt-2.5">
        <p className="text-xs text-muted-foreground">{sub}</p>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
          {trend}
        </span>
      </div>
    </div>
  );
}

function AlertItem({
  color, icon, title, desc,
}: {
  color: 'red' | 'blue' | 'green';
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const styles = {
    red: 'bg-red-50/70 text-red-600 border-red-100',
    blue: 'bg-accent/80 text-accent-foreground border-accent',
    green: 'bg-emerald-50/70 text-emerald-600 border-emerald-100',
  };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[color]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-xs opacity-75 truncate mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
