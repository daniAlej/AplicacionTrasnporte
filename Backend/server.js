import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import api from './server/routes/index.js';
import { syncDB, Role } from './server/models/index.js';


dotenv.config();


const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());


app.get('/', (req, res) => res.json({ ok: true, msg: 'API de transporte 🚍' }));
app.use('/api', api);


const PORT = process.env.PORT || 8000;


(async () => {
  await syncDB();
  // Seed mínimo de roles en tabla Roles (id_rol)
  for (const nombre of ['admin', 'conductor', 'usuario']) {
    await Role.findOrCreate({ where: { nombre }, defaults: { nombre } });
  }


  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
})();
