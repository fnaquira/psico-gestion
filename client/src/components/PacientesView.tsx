import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Trash2, Edit, X, UserCheck, Users, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import type { PacienteDTO } from '../../../shared/types';

const AVATAR_COLORS = [
  'bg-teal-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-600',
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function calcEdad(fechaNacimiento: string): number {
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PacientesView() {
  const [pacientes, setPacientes] = useState<PacienteDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPacientes = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/pacientes', { params: { search, limit: 50 } });
      setPacientes(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPacientes(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPacientes]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este paciente?')) return;
    try {
      await api.delete(`/pacientes/${id}`);
      setPacientes(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const activos = pacientes.filter(p => p.estado === 'activo').length;
  const menores = pacientes.filter(p => p.esMenor).length;
  const enDeuda = pacientes.filter(p => p.estado === 'en_deuda').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Pacientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{pacientes.length} pacientes registrados</p>
        </div>
        <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus size={17} strokeWidth={2.5} />
          Nuevo Paciente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
            <UserCheck size={19} className="text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{activos}</p>
            <p className="text-xs text-muted-foreground font-medium">Pacientes Activos</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <Users size={19} className="text-violet-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{menores}</p>
            <p className="text-xs text-muted-foreground font-medium">Menores con Tutor</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle size={19} className="text-red-500" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500 tracking-tight">{enDeuda}</p>
            <p className="text-xs text-muted-foreground font-medium">Con Deuda</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={2} />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Paciente</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Edad</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Contacto</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tutor</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Estado</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pacientes.map(p => (
                <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(p.nombre)}`}>
                        {getInitials(`${p.nombre} ${p.apellido}`)}
                      </div>
                      <p className="font-medium text-foreground text-sm">{p.nombre} {p.apellido}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground tabular-nums">
                    {calcEdad(p.fechaNacimiento)} años
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground">{p.telefono || '—'}</td>
                  <td className="px-5 py-4 text-sm">
                    {p.tutor ? (
                      <div>
                        <p className="font-medium text-foreground text-sm">{p.tutor.nombre} {p.tutor.apellido}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.tutor.relacion}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p.estado === 'activo'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {p.estado === 'activo' ? 'Activo' : 'En Deuda'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-accent-foreground" title="Ver">
                        <Eye size={14} strokeWidth={1.75} />
                      </button>
                      <button className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-accent-foreground" title="Editar">
                        <Edit size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pacientes.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {searchTerm ? `No se encontraron pacientes para "${searchTerm}"` : 'No hay pacientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
