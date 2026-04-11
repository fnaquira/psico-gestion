import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { Bloqueo } from "../models/Bloqueo";

const router = Router();

// GET /api/bloqueos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get("/", authenticate, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
      return;
    }

    const desdeDate = new Date(`${desde}T00:00:00`);
    const hastaDate = new Date(`${hasta}T00:00:00`);

    const bloqueos = await Bloqueo.find({
      tenantId: req.user!.tenantId,
      fecha: { $gte: desdeDate, $lt: hastaDate },
    }).select("doctorId fecha horaInicio horaFin");

    res.json(bloqueos);
  } catch {
    res.status(500).json({ error: "Error al obtener bloqueos" });
  }
});

export default router;
