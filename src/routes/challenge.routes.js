import express from "express";
import {
  crearReto,
  listarRetosAlumno,
  listarRetosGrupo,
  actualizarReto,
  eliminarReto,
  agregarDatosReto,
  obtenerGrupoPorUsuario,
  listarRetosUsuario,
  obtenerRetoPorId,
} from "../controllers/challenge.controller.js";

const router = express.Router();

router.post("/crear", crearReto);
router.get("/listar-usuario/:uid/:role", listarRetosUsuario);

router.get("/alumno/:uidAlumno", listarRetosAlumno);
router.get("/grupo/:idGrupo", listarRetosGrupo);
router.get("/grupo-usuario/:uid", obtenerGrupoPorUsuario);
router.put("/actualizar/:idReto", actualizarReto);
router.delete("/eliminar/:idReto", eliminarReto);
router.post("/:idReto/agregar-datos", agregarDatosReto);

router.get("/:idReto", obtenerRetoPorId);

export default router;
