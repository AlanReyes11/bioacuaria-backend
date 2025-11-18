import { getFirestore } from "firebase-admin/firestore";
const db = getFirestore();

/* ==========================================================
   🔹 Crear reto (solo maestro/admin)
   ========================================================== */
export const crearReto = async (req, res) => {
  try {
    const { nombre, descripcion, idSitio, nombreSitio, idGrupo, fechaLimite } = req.body;
    if (!nombre || !idSitio || !nombreSitio || !idGrupo) {
      return res.status(400).json({ message: "Faltan datos obligatorios (nombreSitio requerido)" });
    }

    const grupoRef = db.collection("groups").doc(idGrupo);
    const grupoSnap = await grupoRef.get();
    if (!grupoSnap.exists) return res.status(404).json({ message: "Grupo no encontrado" });

    const grupoData = grupoSnap.data();

    const alumnosDatos = (grupoData.alumnos || []).map(a => ({
      uidAlumno: a.uid,
      nombre: a.nombre,
      correo: a.correo,
      estado: "pendiente", // ✅ por defecto
      temperatura: null,
      turbidez: null,
      fechaEntrega: null
    }));

    const maestro = grupoData.idMaestro
      ? {
          uidMaestro: grupoData.idMaestro,
          nombreMaestro: grupoData.nombreMaestro,
          correoMaestro: grupoData.correoMaestro
        }
      : null;

    const nuevoReto = {
      nombre,
      descripcion,
      idSitio,
      nombreSitio, // ✅ nuevo, así ya no mostramos ID en frontend
      idGrupo,
      fechaLimite: fechaLimite || null,
      fechaCreacion: new Date().toISOString(),
      estadoGeneral: "pendiente",
      alumnosDatos,
      maestro
    };

    const docRef = await db.collection("retos").add(nuevoReto);
    res.json({ message: "Reto creado correctamente", idReto: docRef.id });
  } catch (err) {
    console.error("Error al crear reto:", err);
    res.status(500).json({ message: "Error al crear el reto" });
  }
};


/* ==========================================================
   🔹 Listar retos de un grupo
   ========================================================== */
export const listarRetosGrupo = async (req, res) => {
  try {
    const { idGrupo } = req.params;
    if (!idGrupo) {
      return res.status(400).json({ message: "El ID del grupo es requerido" });
    }

    const snapshot = await db
      .collection("retos")
      .where("idGrupo", "==", idGrupo)
      .get();

    const hoy = new Date();

    const retos = snapshot.docs.map(doc => {
      const data = doc.data();
      const fechaLimite = data.fechaLimite ? new Date(data.fechaLimite) : null;

      // Verificar si TODOS los alumnos ya entregaron
      const todosCompletados = data.alumnosDatos.every(a => a.temperatura !== null && a.turbidez !== null);

      let estadoGeneral = "pendiente";

      if (todosCompletados) {
        estadoGeneral = "completado";
      } else if (fechaLimite && fechaLimite < hoy) {
        estadoGeneral = "vencido";
      }

      return {
        idReto: doc.id,
        ...data,
        estadoGeneral
      };
    });

    res.json(retos);
  } catch (err) {
    console.error("Error al listar retos del grupo:", err);
    res.status(500).json({ message: "Error al listar retos del grupo" });
  }
};


/* ==========================================================
   🔹 Agregar datos de un alumno a un reto
   ========================================================== */
export const agregarDatosReto = async (req, res) => {
  try {
    const { idReto } = req.params;
    const { uidAlumno, temperatura, turbidez } = req.body;

    if (!uidAlumno || temperatura == null || turbidez == null) {
      return res.status(400).json({ message: "Faltan datos del alumno o medición" });
    }

    const docRef = db.collection("retos").doc(idReto);
    const retoSnap = await docRef.get();
    if (!retoSnap.exists) return res.status(404).json({ message: "Reto no encontrado" });

    const retoData = retoSnap.data();
    const index = retoData.alumnosDatos.findIndex(a => a.uidAlumno === uidAlumno);
    if (index === -1) return res.status(404).json({ message: "Alumno no asignado" });

    const alumnosActualizados = [...retoData.alumnosDatos];
    alumnosActualizados[index] = {
      ...alumnosActualizados[index],
      temperatura,
      turbidez,
      fechaEntrega: new Date().toISOString(), // ✅ nombre más claro
      estado: "completado"
    };

    const todosCompletados = alumnosActualizados.every(a => a.estado === "completado");

    await docRef.update({
      alumnosDatos: alumnosActualizados,
      estadoGeneral: todosCompletados ? "completado" : "pendiente"
    });

    res.json({ message: "Datos del alumno guardados", alumno: alumnosActualizados[index] });
  } catch (err) {
    console.error("Error al agregar datos al reto:", err);
    res.status(500).json({ message: "Error al agregar datos al reto" });
  }
};


/* ==========================================================
   🔹 Eliminar reto
   ========================================================== */
export const eliminarReto = async (req, res) => {
  try {
    const { idReto } = req.params;
    await db.collection("retos").doc(idReto).delete();
    res.json({ message: "Reto eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar reto:", err);
    res.status(500).json({ message: "Error al eliminar el reto" });
  }
};


export const actualizarReto = async (req, res) => {
  try {
    const { idReto } = req.params;
    const { nombre, descripcion, fechaLimite } = req.body;

    const docRef = db.collection("retos").doc(idReto);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Reto no encontrado" });

    await docRef.update({ nombre, descripcion, fechaLimite });
    res.json({ message: "Reto actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar reto:", err);
    res.status(500).json({ message: "Error al actualizar el reto" });
  }
};


/* ==========================================================
   🔹 Listar retos del alumno con estado correcto
   ========================================================== */
export const listarRetosAlumno = async (req, res) => {
  try {
    const { uidAlumno } = req.params;

    const snapshot = await db.collection("retos").get();
    const hoy = new Date();

    const retosAlumno = snapshot.docs
      .filter(doc => doc.data().alumnosDatos.some(a => a.uidAlumno === uidAlumno))
      .map(doc => {
        const data = doc.data();
        const alumno = data.alumnosDatos.find(a => a.uidAlumno === uidAlumno);
        const fechaLimite = data.fechaLimite ? new Date(data.fechaLimite) : null;

        let estado = alumno.estado || "pendiente";
        if (estado !== "completado" && fechaLimite && fechaLimite < hoy) {
          estado = "vencido";
        }

        return {
          idReto: doc.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          nombreSitio: data.nombreSitio,
          fechaLimite: data.fechaLimite,
          estado,
          maestro: data.maestro
        };
      });

    res.json(retosAlumno);
  } catch (err) {
    console.error("Error al listar retos del alumno:", err);
    res.status(500).json({ message: "Error al listar retos del alumno" });
  }
};


export const obtenerGrupoPorUsuario = async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ message: "UID requerido" });

    const snapshot = await db.collection("groups").get();

    // Buscar grupo donde el UID esté en alumnos o sea el maestro
    const grupoDoc = snapshot.docs.find(doc => {
      const data = doc.data();
      const esMaestro = data.idMaestro === uid;
      const esAlumno = (data.alumnos || []).some(a => a.uid === uid);
      return esMaestro || esAlumno;
    });

    if (!grupoDoc) {
      return res.status(404).json({ message: "No se encontró grupo para este usuario" });
    }

    const grupoData = grupoDoc.data();
    res.json({ id: grupoDoc.id, ...grupoData });

  } catch (err) {
    console.error("Error al obtener grupo:", err);
    res.status(500).json({ message: "Error al obtener grupo", error: err.message });
  }
};


// 🔹 Listar retos según el rol del usuario
export const listarRetosUsuario = async (req, res) => {
  try {
    const { uid, role } = req.params; // role = "Alumno" o "Maestro"
    let retos = [];

    if (role === "Alumno") {
      const snapshot = await db.collection("retos").get();
      retos = snapshot.docs
        .filter(doc => doc.data().alumnosDatos.some(a => a.uidAlumno === uid))
        .map(doc => {
          const data = doc.data();
          const fechaLimite = data.fechaLimite ? new Date(data.fechaLimite) : null;
          const alumno = data.alumnosDatos.find(a => a.uidAlumno === uid);
          let estado = alumno.estado;

          // Si vencido
          if (estado !== "completado" && fechaLimite && fechaLimite < new Date()) estado = "vencido";

         return {
          idReto: doc.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          nombreSitio: data.nombreSitio,
          fechaLimite: data.fechaLimite,
          idGrupo: data.idGrupo,
          idSitio: data.idSitio,
          estado: role === "Alumno"
            ? (data.alumnosDatos.find(a => a.uidAlumno === uid)?.estado || "pendiente")
            : (data.estadoGeneral || "pendiente"),
          maestro: data.maestro
        };
        });
    } else if (role === "Maestro") {
      // Retos donde el usuario es maestro
      const snapshot = await db.collection("retos").get();
      retos = snapshot.docs
        .filter(doc => doc.data().maestro?.uidMaestro === uid)
        .map(doc => ({ idReto: doc.id, ...doc.data() }));
    }

    res.json(retos);
  } catch (err) {
    console.error("Error al listar retos del usuario:", err);
    res.status(500).json({ message: "Error al listar retos", error: err.message });
  }
};

/* ==========================================================
   🔹 Obtener reto por ID
   ========================================================== */
export const obtenerRetoPorId = async (req, res) => {
  try {
    const { idReto } = req.params;

    const docRef = db.collection("retos").doc(idReto);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return res.status(404).json({ message: "Reto no encontrado" });

    res.json({ idReto, ...docSnap.data() });
  } catch (err) {
    console.error("Error al obtener reto:", err);
    res.status(500).json({ message: "Error al obtener reto" });
  }
};