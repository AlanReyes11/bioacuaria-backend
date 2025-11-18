import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultKeyPath = path.join(__dirname, "serviceAccountKey.json");

const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

const finalPath = (envKeyPath || defaultKeyPath).replace(/%20/g, " ");

if (!fs.existsSync(finalPath)) {
  throw new Error(
    `❌ No se encontró la key de Firebase en:\n${finalPath}\n\nAsegúrate de que "serviceAccountKey.json" esté dentro de /src`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(finalPath, "utf8"));

import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase Admin inicializado correctamente");
}

export default admin;
