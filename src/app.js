import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import grupoRoutes from "./routes/group.routes.js";
import siteRoutes from "./routes/site.routes.js";
import sitioRoutes from "./routes/sitio.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";

const app = express();

app.use(cors());

// Aumentar límite para imágenes grandes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/group", grupoRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/sitio", sitioRoutes);
app.use("/api/challenge", challengeRoutes);

app.get("/", (req, res) => {
  res.send("✅ API funcionando correctamente con Firebase Auth");
});

export default app;