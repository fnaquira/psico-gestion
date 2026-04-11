import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface UserItem {
  _id: string;
  nombre: string;
  email: string;
  rol: "admin" | "doctor";
  activo: boolean;
  tenantId: string;
  especialidad: string;
  createdAt: string;
}

export default function AdminUsersView() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "doctor">("doctor");
  const [editActivo, setEditActivo] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (nombre) params.nombre = nombre;
      if (email) params.email = email;
      if (rol) params.rol = rol;
      const { data } = await api.get("/admin/users", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, nombre, email, rol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (user: UserItem) => {
    setEditTarget(user);
    setEditNombre(user.nombre);
    setEditEmail(user.email);
    setEditRol(user.rol);
    setEditActivo(user.activo);
    setEditPassword("");
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, unknown> = {
        nombre: editNombre,
        email: editEmail,
        rol: editRol,
        activo: editActivo,
      };
      if (editPassword) payload.password = editPassword;
      await api.patch(`/admin/users/${editTarget._id}`, payload);
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
          placeholder="Buscar por nombre..."
          value={nombre}
          onChange={e => { setNombre(e.target.value); setPage(1); }}
          className="w-52"
        />
        <Input
          placeholder="Buscar por email..."
          value={email}
          onChange={e => { setEmail(e.target.value); setPage(1); }}
          className="w-52"
        />
        <Select
          value={rol || "todos"}
          onValueChange={v => { setRol(v === "todos" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setNombre(""); setEmail(""); setRol(""); setPage(1); }}
        >
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} usuarios en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tenant</th>
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
                <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.rol === "admin" ? "default" : "secondary"}>{item.rol}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.activo ? "default" : "destructive"}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs truncate max-w-32">
                  {item.tenantId}
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
          <SheetHeader>
            <SheetTitle>Editar Usuario</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={editRol} onValueChange={v => setEditRol(v as "admin" | "doctor")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editActivo} onCheckedChange={setEditActivo} />
              <Label>Activo</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contraseña (opcional)</Label>
              <Input
                type="password"
                placeholder="Dejar vacío para no cambiar"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
              />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {saveError}
              </p>
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
