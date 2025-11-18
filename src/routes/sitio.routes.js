import express from "express";
import {
  obtenerSitio,
  obtenerDatosMonitoreo,
  listarComentarios,
  agregarComentario,
  listarComentariosRecientes
} from "../controllers/sitio.controller.js";

const router = express.Router();

router.get("/", obtenerSitio);
router.get("/monitoreo", obtenerDatosMonitoreo);
router.get("/comentarios", listarComentarios);
router.post("/comentarios", agregarComentario);
router.get("/comentarios/recent", listarComentariosRecientes);

export default router;