import { Router } from "express";
import {
  createUser,
  editarUsuario,
  eliminarUsuario,
  listarUsuarios
} from "../controllers/admin.controller.js";

const router = Router();

router.post("/create-user", createUser);
router.put("/editar-usuario", editarUsuario);
router.delete("/eliminar-usuario/:uid", eliminarUsuario);
router.get("/listar-usuarios", listarUsuarios);

export default router;
