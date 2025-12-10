import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // Importar http para el servidor de WebSockets
import { Server as SocketIOServer } from 'socket.io'; // Importar el servidor de Socket.IO
import api from './server/routes/index.js';
import { syncDB, Role } from './server/models/index.js';
import path from "path";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
// 🔹 Servir carpeta uploads como estática
//app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));
app.use('/uploads', express.static('uploads'));


app.use(cors());

app.use(express.json());


const PORT = process.env.PORT || 8000;

// Crear un servidor HTTP para Express y WebSockets
const server = http.createServer(app);

// Inicializar Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // En producción, cámbialo a la URL de tu frontend
    methods: ["GET", "POST"]
  }
});

// Pasar la instancia de 'io' a todas las rutas a través de un middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => res.json({ ok: true, msg: 'API de transporte 🚍' })); //
app.use('/api', api);

// Lógica de WebSockets
io.on('connection', (socket) => {
  console.log(`Nuevo cliente conectado: ${socket.id}`);

  // Ejemplo de cómo un cliente podría unirse a una "sala" específica (ej. por ruta)
  socket.on('joinRouteRoom', (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`Cliente ${socket.id} se unió a la sala de la ruta ${routeId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

(async () => {
  await syncDB();
  // Seed mínimo de roles en tabla Roles (id_rol)
  for (const nombre of ['admin', 'usuario', 'conductor', 'jefe_recorrido']) {
    await Role.findOrCreate({ where: { nombre }, defaults: { nombre } });
  }

  server.listen(PORT, () => console.log(`Servidor en http://192.168.5.48:${PORT}`));
})();
