import admin from "../firebase.js";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();
const db = getFirestore();

//Crear usuario
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userRole = req.user?.role || "Admin";

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password y role son requeridos" });
    }

    if (!["Admin", "Maestro"].includes(role)) {
      return res.status(400).json({ message: "Rol inválido: solo se permite 'Admin' o 'Maestro'." });
    }

    if (userRole !== "Admin") {
      return res.status(403).json({ message: "No tienes permisos para crear usuarios" });
    }

    const existingSnap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ message: "Ya existe un usuario con ese correo en Firestore." });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const userData = {
      uid: userRecord.uid,
      name,
      email,
      role,
      createdAt: new Date(),
    };

    await db.collection("users").doc(userRecord.uid).set(userData);

    res.status(201).json({
      message: `${role} creado correctamente`,
      user: userData,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "El correo ya está registrado en Firebase Auth" });
    }
    res.status(500).json({ message: "Error al crear usuario", error: error.message });
  }
};

//editar USuario
export const editarUsuario = async (req, res) => {
  try {
    const { uid, name, role } = req.body;
    const userRole = req.user?.role || "Admin"; 

    if (!uid || !name || !role) {
      return res.status(400).json({ message: "uid, name y role son requeridos" });
    }

    if (userRole !== "Admin") {
      return res.status(403).json({ message: "No tienes permisos para editar usuarios" });
    }

    await db.collection("users").doc(uid).update({ name, role });
    await admin.auth().updateUser(uid, { displayName: name });

    res.status(200).json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al editar usuario:", error);
    res.status(500).json({ message: "Error al editar usuario", error: error.message });
  }
};

//Eliminar el usuairo
export const eliminarUsuario = async (req, res) => {
  try {
    const { uid } = req.params;
    const userRole = req.user?.role || "Admin";

    if (!uid) {
      return res.status(400).json({ message: "uid es requerido" });
    }

    if (userRole !== "Admin") {
      return res.status(403).json({ message: "No tienes permisos para eliminar usuarios" });
    }

    await db.collection("users").doc(uid).delete();
    await admin.auth().deleteUser(uid);

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
  }
};

//fincion de consulta de usaurios
export const listarUsuarios = async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ message: "Error al listar usuarios", error: error.message });
  }
};
