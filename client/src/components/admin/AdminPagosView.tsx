import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PagoItem {
  _id: string;
  monto: number;
  fechaPago: string;
  metodo: "efectivo" | "transferencia" | "tarjeta";
  tipoPago: "adelantado" | "al_llegar" | "deuda";
  notas: string;
  tenantId: string;
  pacienteId: string;
}

const metodoBadge = (m: string): "default" | "secondary" | "outline" => {
  if (m === "transferencia") return "default";
  if (m === "tarjeta") return "secondary";
  return "outline";
};

export default function AdminPagosView() {
  const [items, setItems] = useState<PagoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [metodo, setMetodo] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PagoItem | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [editMetodo, setEditMetodo] = useState<PagoItem["metodo"]>("efectivo");
  const [editNotas, setEditNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (metodo) params.metodo = metodo;
      if (tipoPago) params.tipoPago = tipoPago;
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      const { data } = await api.get("/admin/pagos", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, metodo, tipoPago, fechaDesde, fechaHasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (p: PagoItem) => {
    setEditTarget(p);
    setEditMonto(String(p.monto));
    setEditMetodo(p.metodo);
    setEditNotas(p.notas);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/pagos/${editTarget._id}`, {
        monto: Number(editMonto),
        metodo: editMetodo,
        notas: editNotas,
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
        <Select value={metodo || "todos"} onValueChange={v => { setMetodo(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoPago || "todos"} onValueChange={v => { setTipoPago(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="al_llegar">Al llegar</SelectItem>
            <SelectItem value="adelantado">Adelantado</SelectItem>
            <SelectItem value="deuda">Deuda</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" placeholder="Desde" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }} className="w-40" />
        <Input type="date" placeholder="Hasta" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }} className="w-40" />
        <Button variant="outline" size="sm" onClick={() => { setMetodo(""); setTipoPago(""); setFechaDesde(""); setFechaHasta(""); setPage(1); }}>
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} pagos en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Método</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notas</th>
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
                  {new Date(item.fechaPago).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 font-medium">{item.monto.toLocaleString("es-CL")}</td>
                <td className="px-4 py-3">
                  <Badge variant={metodoBadge(item.metodo)}>{item.metodo}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.tipoPago}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-40">{item.notas || "—"}</td>
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
          <SheetHeader><SheetTitle>Editar Pago</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select value={editMetodo} onValueChange={v => setEditMetodo(v as PagoItem["metodo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
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
