import { getFirestore, FieldValue } from "firebase-admin/firestore";
const db = getFirestore();

/* ==========================================================
   🔹 Crear sitio
   ========================================================== */
export const crearSitio = async (req, res) => {
  try {
    const {
      nombre,
      ecosistema,
      descripcion,
      ubicacion,  
      imagenes,    
      datosAgua    
    } = req.body;

    if (!nombre || !ecosistema) {
      return res.status(400).json({ message: "nombre y ecosistema son requeridos" });
    }

    const nuevoSitio = {
      nombre,
      ecosistema,
      descripcion: descripcion || "",
      ubicacion: ubicacion || null,
      imagenes: Array.isArray(imagenes) ? imagenes : [],
      datosAgua: datosAgua || null,
      comentarios: [],
      fechaCreacion: new Date().toISOString()
    };

    const docRef = await db.collection("sitios").add(nuevoSitio);
    const sitioGuardado = await db.collection("sitios").doc(docRef.id).get();

    res.status(201).json({ id: docRef.id, ...sitioGuardado.data(), message: "Sitio creado correctamente" });
  } catch (err) {
    console.error("Error al crear sitio:", err);
    res.status(500).json({ message: "Error al crear sitio", error: err.message });
  }
};

/* ==========================================================
   🔹 Listar todos los sitios
   ========================================================== */
export const listarSitios = async (req, res) => {
  try {
    const snapshot = await db.collection("sitios").get();
    const sitios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sitios);
  } catch (err) {
    console.error("Error al listar sitios:", err);
    res.status(500).json({ message: "Error al listar los sitios" });
  }
};

/* ==========================================================
   🔹 Obtener sitio por ID
   ========================================================== */
export const obtenerSitioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("sitios").doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: "Sitio no encontrado" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error al obtener sitio:", err);
    res.status(500).json({ message: "Error al obtener el sitio" });
  }
};

/* ==========================================================
   🔹 Agregar comentario
   ========================================================== */
export const agregarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, name, texto } = req.body; // ✅ usamos uid en lugar de userId

    if (!uid || !name || !texto) {
      return res.status(400).json({ message: "Faltan datos del comentario" });
    }

    const docRef = db.collection("sitios").doc(id);
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

    res.json({ message: "Comentario agregado correctamente" });
  } catch (err) {
    console.error("Error al agregar comentario:", err);
    res.status(500).json({ message: "Error al agregar comentario" });
  }
};

/* ==========================================================
   🔹 Listar comentarios de un sitio
   ========================================================== */
export const listarComentarios = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("sitios").doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: "Sitio no encontrado" });
    const data = doc.data();
    res.json(data.comentarios || []);
  } catch (err) {
    console.error("Error al listar comentarios:", err);
    res.status(500).json({ message: "Error al listar los comentarios" });
  }
};

/* ==========================================================
   🔹 Listar comentarios recientes
   ========================================================== */
export const listarComentariosRecientes = async (req, res) => {
  try {
    const snapshot = await db.collection("sitios").get();
    let comentarios = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.comentarios) {
        comentarios = comentarios.concat(
          data.comentarios.map(c => ({
            ...c,
            sitioId: doc.id,
            sitioNombre: data.nombre
          }))
        );
      }
    });
    comentarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(comentarios.slice(0, 10)); // últimos 10
  } catch (err) {
    console.error("Error al listar comentarios recientes:", err);
    res.status(500).json({ message: "Error al listar comentarios recientes" });
  }
};

/* ==========================================================
   🔹 Editar sitio
   ========================================================== */
export const editarSitio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ecosistema, descripcion, ubicacion, imagenes } = req.body;

    if (!nombre || !ecosistema) {
      return res.status(400).json({ message: "nombre y ecosistema son requeridos" });
    }

    const docRef = db.collection("sitios").doc(id);
    const sitio = await docRef.get();
    if (!sitio.exists) return res.status(404).json({ message: "Sitio no encontrado" });

    await docRef.update({
      nombre,
      ecosistema,
      descripcion: descripcion || "",
      ubicacion: ubicacion || null,
      imagenes: Array.isArray(imagenes) ? imagenes : []
    });

    res.json({ message: "Sitio actualizado correctamente" });
  } catch (err) {
    console.error("Error al editar sitio:", err);
    res.status(500).json({ message: "Error al editar sitio" });
  }
};
