import admin from "../firebase.js";
import { getFirestore } from "firebase-admin/firestore";
const db = getFirestore();

/* ==========================================================
   🔹 Crear grupo
   ========================================================== */
export const crearGrupo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({ message: "Nombre y descripción son requeridos" });
    }

    const nuevoGrupo = {
      nombre,
      descripcion,
      idMaestro: null,
      correoMaestro: null,
      nombreMaestro: null,
      alumnos: [],
      creadoEn: new Date(),
    };

    const grupoRef = await db.collection("groups").add(nuevoGrupo);

    res.status(201).json({
      message: "Grupo creado correctamente",
      idGrupo: grupoRef.id,
      grupo: nuevoGrupo,
    });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({ message: "Error al crear grupo", error: error.message });
  }
};

/* ==========================================================
   🔹 Asignar maestro al grupo (por correo)
   ========================================================== */
export const asignarMaestro = async (req, res) => {
  try {
    const { idGrupo, correoMaestro } = req.body;
    if (!idGrupo || !correoMaestro) {
      return res.status(400).json({ message: "idGrupo y correoMaestro son requeridos" });
    }

    const maestrosSnap = await db.collection("users").where("email", "==", correoMaestro).limit(1).get();
    if (maestrosSnap.empty) return res.status(404).json({ message: "No se encontró un usuario con ese correo" });

    const maestroDoc = maestrosSnap.docs[0];
    const maestroData = maestroDoc.data();

    if (maestroData.role !== "Maestro") {
      return res.status(400).json({ message: "El usuario encontrado no tiene rol de Maestro" });
    }

    // 🔹 Validación: revisar si el maestro ya pertenece a otro grupo
    const gruposSnap = await db.collection("groups").where("idMaestro", "==", maestroDoc.id).get();
    if (!gruposSnap.empty) {
      return res.status(400).json({ message: "Este maestro ya está asignado a otro grupo" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();
    if (!grupoSnap.exists) return res.status(404).json({ message: "Grupo no encontrado" });

    await grupoRef.update({
      idMaestro: maestroDoc.id,
      correoMaestro: maestroData.email,
      nombreMaestro: maestroData.name,
    });

    res.status(200).json({
      message: "Maestro asignado correctamente",
      maestro: {
        uid: maestroDoc.id,
        nombre: maestroData.name,
        correo: maestroData.email,
      },
    });
  } catch (error) {
    console.error("Error al asignar maestro:", error);
    res.status(500).json({ message: "Error al asignar maestro", error: error.message });
  }
};


/* ==========================================================
   🔹 Agregar alumno al grupo (por correo)
   ========================================================== */
export const agregarAlumno = async (req, res) => {
  try {
    const { idGrupo, correoAlumno } = req.body;
    if (!idGrupo || !correoAlumno) {
      return res.status(400).json({ message: "idGrupo y correoAlumno son requeridos" });
    }

    const alumnosSnap = await db.collection("users").where("email", "==", correoAlumno).limit(1).get();
    if (alumnosSnap.empty) return res.status(404).json({ message: "No se encontró un usuario con ese correo" });

    const alumnoDoc = alumnosSnap.docs[0];
    const alumnoData = alumnoDoc.data();

    if (alumnoData.role !== "Alumno") {
      return res.status(400).json({ message: "El usuario encontrado no tiene rol de Alumno" });
    }

    // 🔹 Validación global
    const gruposSnap = await db.collection("groups").get();
    let alumnoEnOtroGrupo = false;

    gruposSnap.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.alumnos)) {
        const yaExiste = data.alumnos.some(a => a.uid === alumnoDoc.id);
        if (yaExiste && doc.id !== idGrupo) alumnoEnOtroGrupo = true;
      }
    });

    if (alumnoEnOtroGrupo) {
      return res.status(400).json({ message: "El alumno ya pertenece a otro grupo" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();
    if (!grupoSnap.exists) return res.status(404).json({ message: "Grupo no encontrado" });

    const nuevoAlumno = {
      uid: alumnoDoc.id,
      nombre: alumnoData.name,
      correo: alumnoData.email,
    };

    await grupoRef.update({
      alumnos: admin.firestore.FieldValue.arrayUnion(nuevoAlumno),
    });

    res.status(200).json({
      message: "Alumno agregado correctamente",
      alumno: nuevoAlumno,
    });
  } catch (error) {
    console.error("Error al agregar alumno:", error);
    res.status(500).json({ message: "Error al agregar alumno", error: error.message });
  }
};



/* ==========================================================
   🔹 Editar grupo
   ========================================================== */
export const editarGrupo = async (req, res) => {
  try {
    const { idGrupo, nombre, descripcion } = req.body;

    if (!idGrupo || !nombre || !descripcion) {
      return res.status(400).json({ message: "idGrupo, nombre y descripción son requeridos" });
    }

    await db.collection("groups").doc(idGrupo).update({ nombre, descripcion });
    res.status(200).json({ message: "Grupo actualizado correctamente" });
  } catch (error) {
    console.error("Error al editar grupo:", error);
    res.status(500).json({ message: "Error al editar grupo", error: error.message });
  }
};

/* ==========================================================
   🔹 Eliminar grupo
   ========================================================== */
export const eliminarGrupo = async (req, res) => {
  try {
    const { idGrupo } = req.params;

    await db.collection("groups").doc(idGrupo).delete();
    res.status(200).json({ message: "Grupo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    res.status(500).json({ message: "Error al eliminar grupo", error: error.message });
  }
};

/* ==========================================================
   🔹 Listar grupos
   ========================================================== */
export const listarGrupos = async (req, res) => {
  try {
    const groupsSnap = await db.collection("groups").get();
    const groups = groupsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error al listar grupos:", error);
    res.status(500).json({ message: "Error al listar grupos", error: error.message });
  }
};


/* ==========================================================
   🔹 Obtener grupo por ID
   ========================================================== */
export const obtenerGrupoPorId = async (req, res) => {
  try {
    const { idGrupo } = req.params;

    if (!idGrupo) {
      return res.status(400).json({ message: "El ID del grupo es requerido" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();

    if (!grupoSnap.exists) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    res.status(200).json({
      id: grupoSnap.id,
      ...grupoSnap.data(),
    });
  } catch (error) {
    console.error("Error al obtener grupo:", error);
    res.status(500).json({ message: "Error al obtener grupo", error: error.message });
  }
};

//METODO PARA QUITAR ALUMNO (SOLO PARRA MAESTROS   Y ADMINISTRADORES)

export const quitarAlumno = async (req, res) => {
  try {
    const { idGrupo, uidAlumno, correoAlumno } = req.body;
    const userRole = req.user?.role || "Maestro"; // ⚙️ fallback temporal

    if (!idGrupo || (!uidAlumno && !correoAlumno)) {
      return res.status(400).json({ message: "idGrupo y uidAlumno o correoAlumno son requeridos" });
    }

    if (!["Admin", "Maestro"].includes(userRole)) {
      return res.status(403).json({ message: "No tienes permisos para quitar alumnos" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();
    if (!grupoSnap.exists) return res.status(404).json({ message: "Grupo no encontrado" });

    const grupoData = grupoSnap.data();
    if (!Array.isArray(grupoData.alumnos) || grupoData.alumnos.length === 0) {
      return res.status(400).json({ message: "No hay alumnos en este grupo" });
    }

    // 🔹 Buscar por UID o correo
    const alumno = grupoData.alumnos.find(
      a => a.uid === uidAlumno || a.correo === correoAlumno
    );

    if (!alumno) return res.status(404).json({ message: "Alumno no encontrado en este grupo" });

    await grupoRef.update({
      alumnos: admin.firestore.FieldValue.arrayRemove(alumno),
    });

    res.status(200).json({ message: "Alumno eliminado correctamente", alumno });
  } catch (error) {
    console.error("Error al quitar alumno:", error);
    res.status(500).json({ message: "Error al quitar alumno", error: error.message });
  }
};


//METIDI POAARA QUITAR MAERSTROS (SOLO PARA ADMINISTRADORES)

export const quitarMaestro = async (req, res) => {
  try {
    const { idGrupo, idMaestro, correoMaestro } = req.body;
    const userRole = req.user?.role || "Admin"; // ⚙️ fallback temporal si no hay middleware

    // 🔹 Validaciones
    if (!idGrupo || (!idMaestro && !correoMaestro)) {
      return res.status(400).json({
        message: "idGrupo y idMaestro o correoMaestro son requeridos",
      });
    }

    // 🔹 Solo Admin puede quitar maestro
    if (userRole !== "Admin") {
      return res
        .status(403)
        .json({ message: "No tienes permisos para quitar al maestro" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();
    if (!grupoSnap.exists) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const grupoData = grupoSnap.data();

    // 🔹 Validar si hay maestro asignado
    if (!grupoData.idMaestro && !grupoData.correoMaestro) {
      return res.status(400).json({ message: "Este grupo no tiene maestro asignado" });
    }

    // 🔹 Verificar coincidencia (por ID o correo)
    const coincide =
      grupoData.idMaestro === idMaestro ||
      grupoData.correoMaestro === correoMaestro;

    if (!coincide) {
      return res.status(404).json({
        message: "El maestro especificado no coincide con el asignado al grupo",
      });
    }

    // 🔹 Eliminar campos del maestro del grupo
    await grupoRef.update({
      idMaestro: admin.firestore.FieldValue.delete(),
      nombreMaestro: admin.firestore.FieldValue.delete(),
      correoMaestro: admin.firestore.FieldValue.delete(),
    });

    res.status(200).json({
      message: "Maestro eliminado correctamente del grupo",
    });
  } catch (error) {
    console.error("Error al quitar maestro:", error);
    res.status(500).json({
      message: "Error al quitar maestro",
      error: error.message,
    });
  }
};
