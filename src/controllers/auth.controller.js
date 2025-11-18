// controllers/auth.controller.js
import admin from "../firebase.js";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
dotenv.config();

const db = getFirestore();
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

if (!FIREBASE_API_KEY) {
  console.warn("FIREBASE_API_KEY no definido en .env - el login con contraseña no funcionará.");
}

// helper: obtener fetch (node 18+ tiene global fetch, si no, usa node-fetch)
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    // dinámicamente importar node-fetch para no romper en entornos con fetch nativo
    const nodeFetch = await import("node-fetch");
    fetchFn = nodeFetch.default;
  } catch (err) {
    console.error("No se encontró 'fetch' ni pudo importar 'node-fetch'.", err);
    throw err;
  }
}

// Registro (igual que antes)
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "name, email y password son requeridos" });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: "Alumno",
    });

    res.status(201).json({ message: "Usuario registrado correctamente", uid: userRecord.uid });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(400).json({ message: "Error al registrar usuario", error: error.message });
  }
};

// Login - usa la REST API para validar contraseña y luego verifica token con Admin
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email y password requeridos" });

    if (!FIREBASE_API_KEY) {
      return res.status(500).json({ message: "FIREBASE_API_KEY no configurada en el servidor" });
    }

    // 1) Verificar credenciales con Firebase REST (signInWithPassword)
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const response = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();

    // Log para depuración (borra o reduce en producción)
    console.log("Respuesta signInWithPassword:", data);

    if (data.error) {
      // Mapear errores comunes de Firebase a mensajes amigables
      const errMsg = data.error.message || "";
      if (errMsg.includes("EMAIL_NOT_FOUND")) {
        return res.status(401).json({ message: "Usuario no registrado" });
      } else if (errMsg.includes("INVALID_PASSWORD")) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      } else if (errMsg.includes("USER_DISABLED")) {
        return res.status(403).json({ message: "Usuario deshabilitado" });
      } else {
        return res.status(401).json({ message: "Credenciales inválidas", error: data.error });
      }
    }

    // data contiene idToken, localId (uid), refreshToken, expiresIn...
    const { idToken, localId: uid } = data;

    // 2) Verificar idToken con Firebase Admin (opcional pero recomendado)
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error("verifyIdToken falló:", err);
      // aun así podemos seguir si la verificación falla, pero mejor avisar
      return res.status(401).json({ message: "Token inválido tras login", error: err.message });
    }

    // 3) Obtener datos del usuario desde Firestore
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(401).json({ message: "Usuario no encontrado en Firestore" });
    }
    const userData = userSnap.data();

    // 4) Responder con datos útiles (idToken lo usa el frontend)
    return res.status(200).json({
      message: "Login exitoso",
      uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      idToken,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error al iniciar sesión", error: error.message });
  }
};
