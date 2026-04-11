import { Router } from "express";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";
import { User } from "../models/User.js";
import type { Alerta, CitaDelDia } from "../../shared/types.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const tenantOid = new Types.ObjectId(tenantId!);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    citasHoyDocs,
    pacientesActivos,
    pacientesNuevosMes,
    ingresosMesArr,
    ingresosPrevArr,
    pacientesEnDeuda,
    deudasSumArr,
    ingresosUltimos7Arr,
    citasDiaPopuladas,
    alertasDeuda,
  ] = await Promise.all([
    Cita.find({ tenantId: tenantId!, fecha: { $gte: todayStart, $lt: todayEnd } })
      .populate("pacienteId", "nombre apellido")
      .populate("doctorId", "nombre")
      .lean(),

    Paciente.countDocuments({ tenantId: tenantId!, estado: "activo" }),

    Paciente.countDocuments({ tenantId: tenantId!, fechaRegistro: { $gte: monthStart } }),

    Pago.aggregate([
      { $match: { tenantId: tenantOid, fechaPago: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$monto" } } },
    ]),

    Pago.aggregate([
      {
        $match: {
          tenantId: tenantOid,
          fechaPago: { $gte: prevMonthStart, $lt: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$monto" } } },
    ]),

    Paciente.countDocuments({ tenantId: tenantId!, estado: "en_deuda" }),

    Paciente.aggregate([
      { $match: { tenantId: tenantOid, estado: "en_deuda" } },
      {
        $lookup: {
          from: "pagos",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$pacienteId", "$$pid"] },
                    { $eq: ["$tipoPago", "deuda"] },
                  ],
                },
              },
            },
          ],
          as: "pagosDeuda",
        },
      },
      { $project: { deuda: { $sum: "$pagosDeuda.monto" } } },
      { $group: { _id: null, total: { $sum: "$deuda" } } },
    ]),

    Pago.aggregate([
      {
        $match: {
          tenantId: tenantOid,
          fechaPago: { $gte: new Date(now.getTime() - 6 * 86400000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$fechaPago" },
          },
          monto: { $sum: "$monto" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Cita.find({ tenantId: tenantId!, fecha: { $gte: todayStart, $lt: todayEnd } })
      .populate("pacienteId", "nombre apellido")
      .populate("doctorId", "nombre")
      .sort("horaInicio")
      .lean(),

    Paciente.find({ tenantId: tenantId!, estado: "en_deuda" }).limit(5).lean(),
  ]);

  const ingresosMes = ingresosMesArr[0]?.total ?? 0;
  const ingresosPrev = ingresosPrevArr[0]?.total ?? 0;
  const ingresosVariacion =
    ingresosPrev > 0 ? Math.round(((ingresosMes - ingresosPrev) / ingresosPrev) * 100) : 0;

  // Build 7-day labels
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const ingresosMap = new Map<string, number>(
    ingresosUltimos7Arr.map((d: { _id: string; monto: number }) => [d._id, d.monto]),
  );
  const ingresosUltimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000);
    const key = d.toISOString().split("T")[0];
    return {
      dia: i === 6 ? "Hoy" : dias[d.getDay()],
      monto: ingresosMap.get(key) ?? 0,
    };
  });

  const citasDelDia: CitaDelDia[] = citasDiaPopuladas.map((c: any) => ({
    hora: c.horaInicio,
    paciente: c.pacienteId ? `${c.pacienteId.nombre} ${c.pacienteId.apellido}` : "—",
    tipo: c.tipoSesion,
    doctor: c.doctorId?.nombre ?? "—",
    estado: c.estado === "programada" ? "Confirmada" : "Pendiente",
  }));

  const alertas: Alerta[] = alertasDeuda.slice(0, 5).map((p: any) => ({
    tipo: "deuda",
    mensaje: `${p.nombre} ${p.apellido}`,
    detalle: "Deuda pendiente",
  }));

  // Citas próximas en 1 hora
  const enUnaHora = new Date(now.getTime() + 3600000);
  const citasProximas = citasHoyDocs.filter((c: any) => {
    const [h, m] = c.horaInicio.split(":").map(Number);
    const citaTime = new Date(todayStart);
    citaTime.setHours(h, m);
    return citaTime >= now && citaTime <= enUnaHora;
  });
  citasProximas.forEach((c: any) => {
    alertas.push({
      tipo: "cita_proxima",
      mensaje: c.pacienteId ? `${c.pacienteId.nombre} ${c.pacienteId.apellido}` : "—",
      detalle: `Cita a las ${c.horaInicio}`,
    });
  });

  res.json({
    citasHoy: citasHoyDocs.length,
    citasHoyPendientes: citasProximas.length,
    pacientesActivos,
    pacientesNuevosMes,
    ingresosMes,
    ingresosVariacion,
    deudasTotal: deudasSumArr[0]?.total ?? 0,
    pacientesEnDeuda,
    ingresosUltimos7Dias,
    alertas,
    citasDelDia,
  });
});

export default router;
