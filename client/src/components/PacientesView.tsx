import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Edit,
  X,
  UserCheck,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "../lib/api";
import type { PacienteDTO } from "../../../shared/types";

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function calcEdad(fechaNacimiento: string): number {
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  fechaNacimiento: "",
  esMenor: false,
  genero: "Otro" as "M" | "F" | "Otro",
  telefono: "",
  email: "",
  direccion: "",
  notasClinicas: "",
  // Tutor fields (when esMenor)
  tutorNombre: "",
  tutorApellido: "",
  tutorRelacion: "padre" as "padre" | "madre" | "tutor_legal" | "otro",
  tutorTelefono: "",
  tutorEmail: "",
  tutorDocumento: "",
};

export default function PacientesView() {
  const [pacientes, setPacientes] = useState<PacienteDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<PacienteDTO | null>(
    null,
  );
  const [viewingPaciente, setViewingPaciente] = useState<PacienteDTO | null>(
    null,
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchPacientes = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/pacientes", {
        params: { search, limit: 50 },
      });
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
    if (!confirm("¿Eliminar este paciente?")) return;
    try {
      await api.delete(`/pacientes/${id}`);
      setPacientes(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setEditingPaciente(null);
    setForm(EMPTY_FORM);
    setFormDialogOpen(true);
  };

  const openEdit = (p: PacienteDTO) => {
    setEditingPaciente(p);
    setForm({
      nombre: p.nombre,
      apellido: p.apellido,
      fechaNacimiento: p.fechaNacimiento?.split("T")[0] ?? "",
      esMenor: p.esMenor,
      genero: p.genero,
      telefono: p.telefono ?? "",
      email: p.email ?? "",
      direccion: p.direccion ?? "",
      notasClinicas: p.notasClinicas ?? "",
      tutorNombre: p.tutor?.nombre ?? "",
      tutorApellido: p.tutor?.apellido ?? "",
      tutorRelacion: p.tutor?.relacion ?? "padre",
      tutorTelefono: p.tutor?.telefono ?? "",
      tutorEmail: p.tutor?.email ?? "",
      tutorDocumento: p.tutor?.documento ?? "",
    });
    setFormDialogOpen(true);
  };

  const openDetail = async (p: PacienteDTO) => {
    try {
      const { data } = await api.get(`/pacientes/${p._id}`);
      setViewingPaciente(data);
    } catch {
      setViewingPaciente(p);
    }
    setDetailDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre,
        apellido: form.apellido,
        fechaNacimiento: form.fechaNacimiento,
        esMenor: form.esMenor,
        genero: form.genero,
        telefono: form.telefono,
        email: form.email,
        direccion: form.direccion,
        notasClinicas: form.notasClinicas,
      };

      if (form.esMenor && form.tutorNombre && form.tutorApellido) {
        body.tutor = {
          nombre: form.tutorNombre,
          apellido: form.tutorApellido,
          relacion: form.tutorRelacion,
          telefono: form.tutorTelefono,
          email: form.tutorEmail,
          documento: form.tutorDocumento,
        };
      }

      if (editingPaciente) {
        await api.put(`/pacientes/${editingPaciente._id}`, body);
      } else {
        await api.post("/pacientes", body);
      }

      setFormDialogOpen(false);
      fetchPacientes(searchTerm);
    } catch (err) {
      console.error("Error saving paciente:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const activos = pacientes.filter(p => p.estado === "activo").length;
  const menores = pacientes.filter(p => p.esMenor).length;
  const enDeuda = pacientes.filter(p => p.estado === "en_deuda").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Pacientes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pacientes.length} pacientes registrados
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={17} strokeWidth={2.5} />
          Nuevo Paciente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
            <UserCheck
              size={19}
              className="text-primary"
              strokeWidth={1.75}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {activos}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Pacientes Activos
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
            <Users size={19} className="text-violet-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {menores}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Menores con Tutor
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle
              size={19}
              className="text-red-500"
              strokeWidth={1.75}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500 tracking-tight">
              {enDeuda}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Con Deuda
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-card transition-shadow"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
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
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Paciente
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Edad
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Contacto
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Tutor
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pacientes.map(p => (
                <tr
                  key={p._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(p.nombre)}`}
                      >
                        {getInitials(`${p.nombre} ${p.apellido}`)}
                      </div>
                      <p className="font-medium text-foreground text-sm">
                        {p.nombre} {p.apellido}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground tabular-nums">
                    {calcEdad(p.fechaNacimiento)} años
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground">
                    {p.telefono || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {p.tutor ? (
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {p.tutor.nombre} {p.tutor.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.tutor.relacion}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.estado === "activo"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {p.estado === "activo" ? "Activo" : "En Deuda"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDetail(p)}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-accent-foreground"
                        title="Ver"
                      >
                        <Eye size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-accent-foreground"
                        title="Editar"
                      >
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
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    {searchTerm
                      ? `No se encontraron pacientes para "${searchTerm}"`
                      : "No hay pacientes registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPaciente ? "Editar Paciente" : "Nuevo Paciente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e =>
                    setForm(f => ({ ...f, nombre: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={form.apellido}
                  onChange={e =>
                    setForm(f => ({ ...f, apellido: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={e =>
                    setForm(f => ({ ...f, fechaNacimiento: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Género
                </label>
                <select
                  value={form.genero}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      genero: e.target.value as typeof form.genero,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={e =>
                    setForm(f => ({ ...f, telefono: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e =>
                    setForm(f => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Dirección
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={e =>
                  setForm(f => ({ ...f, direccion: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Notas Clínicas
              </label>
              <textarea
                value={form.notasClinicas}
                onChange={e =>
                  setForm(f => ({ ...f, notasClinicas: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* Es Menor toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="esMenor"
                checked={form.esMenor}
                onChange={e =>
                  setForm(f => ({ ...f, esMenor: e.target.checked }))
                }
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="esMenor" className="text-sm font-medium text-foreground cursor-pointer">
                Es menor de edad (requiere tutor)
              </label>
            </div>

            {/* Tutor fields */}
            {form.esMenor && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold text-foreground">
                  Datos del Tutor
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={form.tutorNombre}
                      onChange={e =>
                        setForm(f => ({ ...f, tutorNombre: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={form.tutorApellido}
                      onChange={e =>
                        setForm(f => ({ ...f, tutorApellido: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Relación
                    </label>
                    <select
                      value={form.tutorRelacion}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          tutorRelacion:
                            e.target.value as typeof form.tutorRelacion,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="padre">Padre</option>
                      <option value="madre">Madre</option>
                      <option value="tutor_legal">Tutor Legal</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={form.tutorTelefono}
                      onChange={e =>
                        setForm(f => ({ ...f, tutorTelefono: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.tutorEmail}
                      onChange={e =>
                        setForm(f => ({ ...f, tutorEmail: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Documento
                    </label>
                    <input
                      type="text"
                      value={form.tutorDocumento}
                      onChange={e =>
                        setForm(f => ({ ...f, tutorDocumento: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setFormDialogOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : editingPaciente ? (
                  "Guardar"
                ) : (
                  "Crear Paciente"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Paciente</DialogTitle>
          </DialogHeader>
          {viewingPaciente && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(viewingPaciente.nombre)}`}
                >
                  {getInitials(
                    `${viewingPaciente.nombre} ${viewingPaciente.apellido}`,
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {viewingPaciente.nombre} {viewingPaciente.apellido}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${viewingPaciente.estado === "activo" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                  >
                    {viewingPaciente.estado === "activo"
                      ? "Activo"
                      : "En Deuda"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow
                  label="Edad"
                  value={`${calcEdad(viewingPaciente.fechaNacimiento)} años`}
                />
                <DetailRow
                  label="Género"
                  value={
                    viewingPaciente.genero === "M"
                      ? "Masculino"
                      : viewingPaciente.genero === "F"
                        ? "Femenino"
                        : "Otro"
                  }
                />
                <DetailRow
                  label="Teléfono"
                  value={viewingPaciente.telefono || "—"}
                />
                <DetailRow
                  label="Email"
                  value={viewingPaciente.email || "—"}
                />
                <DetailRow
                  label="Dirección"
                  value={viewingPaciente.direccion || "—"}
                />
                <DetailRow
                  label="Menor"
                  value={viewingPaciente.esMenor ? "Sí" : "No"}
                />
              </div>

              {viewingPaciente.notasClinicas && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Notas Clínicas
                  </p>
                  <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">
                    {viewingPaciente.notasClinicas}
                  </p>
                </div>
              )}

              {viewingPaciente.tutor && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tutor
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {viewingPaciente.tutor.nombre}{" "}
                    {viewingPaciente.tutor.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {viewingPaciente.tutor.relacion} ·{" "}
                    {viewingPaciente.tutor.telefono}
                  </p>
                </div>
              )}

              <DialogFooter>
                <button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openEdit(viewingPaciente);
                  }}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Editar
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-foreground mt-0.5">{value}</p>
    </div>
  );
}
