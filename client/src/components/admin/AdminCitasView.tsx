import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CitaItem {
  _id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "programada" | "realizada" | "cancelada" | "no_asistio";
  tipoSesion: string;
  montoCita: number;
  notas: string;
  tenantId: string;
  pacienteId: string;
  doctorId: string;
}

const estadoBadge = (estado: string): "default" | "destructive" | "secondary" => {
  if (estado === "realizada") return "default";
  if (estado === "cancelada" || estado === "no_asistio") return "destructive";
  return "secondary";
};

export default function AdminCitasView() {
  const [items, setItems] = useState<CitaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CitaItem | null>(null);
  const [editEstado, setEditEstado] = useState<CitaItem["estado"]>("programada");
  const [editNotas, setEditNotas] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFin, setEditHoraFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      const { data } = await api.get("/admin/citas", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, fecha, estado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (c: CitaItem) => {
    setEditTarget(c);
    setEditEstado(c.estado);
    setEditNotas(c.notas);
    setEditMonto(String(c.montoCita));
    setEditHoraInicio(c.horaInicio);
    setEditHoraFin(c.horaFin);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/citas/${editTarget._id}`, {
        estado: editEstado,
        notas: editNotas,
        montoCita: Number(editMonto),
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
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
        <Input
          type="date"
          value={fecha}
          onChange={e => { setFecha(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select value={estado || "todos"} onValueChange={v => { setEstado(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="programada">Programada</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="no_asistio">No asistió</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setFecha(""); setEstado(""); setPage(1); }}>Limpiar</Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} citas en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Horario</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
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
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.fecha).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.horaInicio} – {item.horaFin}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{item.tipoSesion}</td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge(item.estado)}>{item.estado}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.montoCita.toLocaleString("es-CL")}</td>
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
          <SheetHeader><SheetTitle>Editar Cita</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={editEstado} onValueChange={v => setEditEstado(v as CitaItem["estado"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_asistio">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora inicio</Label>
                <Input placeholder="09:00" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora fin</Label>
                <Input placeholder="10:00" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={3} />
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
