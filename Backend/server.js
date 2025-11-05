import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import api from './server/routes/index.js';
import { syncDB, Role } from './server/models/index.js';
import path from "path";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
// 🔹 Servir carpeta uploads como estática
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));


app.use(cors());

app.use(express.json());


app.get('/', (req, res) => res.json({ ok: true, msg: 'API de transporte 🚍' }));
app.use('/api', api);


const PORT = process.env.PORT || 8000;


(async () => {
  await syncDB();
  // Seed mínimo de roles en tabla Roles (id_rol)
  for (const nombre of ['admin', 'usuario']) {
    await Role.findOrCreate({ where: { nombre }, defaults: { nombre } });
  }


  app.listen(PORT, () => console.log(`Servidor en http://192.168.5.19:${PORT}`));
})();
