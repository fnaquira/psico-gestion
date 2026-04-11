import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface TenantItem {
  _id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  settings: { currency: string; timezone: string; sessionPrice: number };
}

export default function AdminTenantsView() {
  const [items, setItems] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (name) params.name = name;
      const { data } = await api.get("/admin/tenants", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, name]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const planVariant = (plan: string): "default" | "secondary" | "outline" =>
    plan === "enterprise" ? "default" : plan === "pro" ? "secondary" : "outline";

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={name}
          onChange={e => { setName(e.target.value); setPage(1); }}
          className="w-60"
        />
        <Button variant="outline" size="sm" onClick={() => { setName(""); setPage(1); }}>
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} consultorios en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Moneda</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
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
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.slug}</td>
                <td className="px-4 py-3">
                  <Badge variant={planVariant(item.plan)}>{item.plan}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.settings?.currency ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.createdAt).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditTarget(item); setSheetOpen(true); }}>
                    Ver
                  </Button>
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
          <SheetHeader>
            <SheetTitle>Detalle del Consultorio</SheetTitle>
          </SheetHeader>
          {editTarget && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="space-y-1">
                <Label className="text-muted-foreground">ID</Label>
                <p className="font-mono text-xs break-all">{editTarget._id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">{editTarget.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Slug</Label>
                <p className="font-mono">{editTarget.slug}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Plan</Label>
                <Badge variant={planVariant(editTarget.plan) as any}>{editTarget.plan}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Moneda</Label>
                <p>{editTarget.settings?.currency}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Zona horaria</Label>
                <p>{editTarget.settings?.timezone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Precio sesión</Label>
                <p>{editTarget.settings?.sessionPrice}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Creado</Label>
                <p>{new Date(editTarget.createdAt).toLocaleString("es-CL")}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
