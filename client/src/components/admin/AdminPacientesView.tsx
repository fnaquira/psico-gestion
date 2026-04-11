import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PacienteItem {
  _id: string;
  nombre: string;
  apellido: string;
  estado: "activo" | "inactivo" | "en_deuda";
  telefono: string;
  email: string;
  notasClinicas: string;
  tenantId: string;
  fechaRegistro: string;
}

const estadoBadge = (estado: string): "default" | "destructive" | "secondary" => {
  if (estado === "activo") return "default";
  if (estado === "en_deuda") return "destructive";
  return "secondary";
};

export default function AdminPacientesView() {
  const [items, setItems] = useState<PacienteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PacienteItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEstado, setEditEstado] = useState<"activo" | "inactivo" | "en_deuda">("activo");
  const [editNotas, setEditNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (nombre) params.nombre = nombre;
      if (apellido) params.apellido = apellido;
      if (estado) params.estado = estado;
      const { data } = await api.get("/admin/pacientes", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, nombre, apellido, estado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (p: PacienteItem) => {
    setEditTarget(p);
    setEditNombre(p.nombre);
    setEditApellido(p.apellido);
    setEditTelefono(p.telefono);
    setEditEmail(p.email);
    setEditEstado(p.estado);
    setEditNotas(p.notasClinicas);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/pacientes/${editTarget._id}`, {
        nombre: editNombre,
        apellido: editApellido,
        telefono: editTelefono,
        email: editEmail,
        estado: editEstado,
        notasClinicas: editNotas,
      });
      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Nombre..." value={nombre} onChange={e => { setNombre(e.target.value); setPage(1); }} className="w-44" />
        <Input placeholder="Apellido..." value={apellido} onChange={e => { setApellido(e.target.value); setPage(1); }} className="w-44" />
        <Select value={estado || "todos"} onValueChange={v => { setEstado(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
            <SelectItem value="en_deuda">En deuda</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setNombre(""); setApellido(""); setEstado(""); setPage(1); }}>Limpiar</Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} pacientes en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Apellido</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{item.nombre}</td>
                <td className="px-4 py-3">{item.apellido}</td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge(item.estado)}>{item.estado}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.telefono || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.fechaRegistro).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Editar Paciente</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input value={editApellido} onChange={e => setEditApellido(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={editEstado} onValueChange={v => setEditEstado(v as PacienteItem["estado"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="en_deuda">En deuda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notas clínicas</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={4} />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{saveError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
