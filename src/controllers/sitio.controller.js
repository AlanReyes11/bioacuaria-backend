import { getFirestore, FieldValue } from "firebase-admin/firestore";
const db = getFirestore();

const COLECCION = "sitio";
const ID_UNICO = "lagoUT"; // id fijo para el sitio especial

/* ==========================================================
   🔹 Obtener todo el sitio
   GET /api/sitio
   ========================================================== */
export const obtenerSitio = async (req, res) => {
  try {
    const doc = await db.collection(COLECCION).doc(ID_UNICO).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Sitio especial no encontrado" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error al obtener sitio especial:", err);
    res.status(500).json({ message: "Error al obtener el sitio especial" });
  }
};

/* ==========================================================
   🔹 Obtener datos de monitoreo
   GET /api/sitio/monitoreo
   ========================================================== */
export const obtenerDatosMonitoreo = async (req, res) => {
  try {
    const doc = await db.collection(COLECCION).doc(ID_UNICO).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Sitio especial no encontrado" });
    }

    const data = doc.data();
    res.json({
      temperatura: data.temperatura ?? null,
      turbidez: data.turbidez ?? null
    });
  } catch (err) {
    console.error("Error al obtener datos de monitoreo:", err);
    res.status(500).json({ message: "Error al obtener datos del monitoreo" });
  }
};

/* ==========================================================
   🔹 Listar comentarios
   GET /api/sitio/comentarios
   ========================================================== */
export const listarComentarios = async (req, res) => {
  try {
    const doc = await db.collection(COLECCION).doc(ID_UNICO).get();
    if (!doc.exists) return res.status(404).json({ message: "Sitio no encontrado" });

    const data = doc.data();
    res.json(data.comentarios || []);
  } catch (err) {
    console.error("Error al listar comentarios:", err);
    res.status(500).json({ message: "Error al listar los comentarios" });
  }
};

/* ==========================================================
   🔹 Agregar comentario
   POST /api/sitio/comentarios
   ========================================================== */
export const agregarComentario = async (req, res) => {
  try {
    const { uid, name, texto } = req.body;

    if (!uid || !name || !texto) {
      return res.status(400).json({ message: "Faltan datos del comentario" });
    }

    const docRef = db.collection(COLECCION).doc(ID_UNICO);
    const sitio = await docRef.get();
    if (!sitio.exists) return res.status(404).json({ message: "Sitio no encontrado" });

    const nuevoComentario = {
      uid,
      name,
      texto,
      fecha: new Date().toISOString()
    };

    await docRef.update({
      comentarios: FieldValue.arrayUnion(nuevoComentario)
    });

    res.json({
      message: "Comentario agregado correctamente",
      comentario: nuevoComentario
    });
  } catch (err) {
    console.error("Error al agregar comentario:", err);
    res.status(500).json({ message: "Error al agregar comentario" });
  }
};

/* ==========================================================
   🔹 Listar comentarios recientes
   GET /api/sitio/comentarios/recent
   ========================================================== */
export const listarComentariosRecientes = async (req, res) => {
  try {
    const snapshot = await db.collection(COLECCION).get();
    let comentarios = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.comentarios) {
        comentarios = comentarios.concat(
          data.comentarios.map(c => ({
            ...c,
            sitioId: doc.id,
            sitioNombre: data.nombre ?? "Desconocido"
          }))
        );
      }
    });

    comentarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(comentarios.slice(0, 10));
  } catch (err) {
    console.error("Error listar comentarios recientes:", err);
    res.status(500).json({ message: "Error al listar comentarios recientes" });
  }
};