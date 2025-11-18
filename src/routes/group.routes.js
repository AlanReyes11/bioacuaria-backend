import { Router } from "express";
import {
  crearGrupo,
  asignarMaestro,
  agregarAlumno,
  editarGrupo,
  eliminarGrupo,
  listarGrupos,
  obtenerGrupoPorId,
  quitarAlumno,
  quitarMaestro
} from "../controllers/group.controller.js";

const router = Router();

router.post("/crear-grupo", crearGrupo);
router.post("/asignar-maestro", asignarMaestro);
router.post("/agregar-alumno", agregarAlumno);
router.get("/obtener-grupo/:idGrupo", obtenerGrupoPorId);
router.put("/editar-grupo", editarGrupo);
router.delete("/eliminar-grupo/:idGrupo", eliminarGrupo);
router.get("/listar-grupos", listarGrupos);
router.post("/quitar-alumno", quitarAlumno);
router.post("/quitar-maestro", quitarMaestro);

export default router;
