import { Router } from "express";
import {
  crearSitio,
  listarSitios,
  obtenerSitioPorId,
  agregarComentario,
  listarComentarios,
  listarComentariosRecientes,
  editarSitio
} from "../controllers/site.controller.js";

const router = Router();

router.post("/crear-sitio", crearSitio);  
router.get("/listar-sitios", listarSitios);
router.get("/obtener-sitio/:id", obtenerSitioPorId);
router.post("/agregar-comentario/:id", agregarComentario);
router.get("/listar-comentarios/:id", listarComentarios);
router.get("/comentarios-recientes", listarComentariosRecientes);
router.put("/editar-sitio/:id", editarSitio);


export default router;
