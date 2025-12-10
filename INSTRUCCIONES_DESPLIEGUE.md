# 🚀 Instrucciones de Despliegue - Sistema de Proximidad

## ⚡ Inicio Rápido

### **1. Backend**

El backend ya debería estar corriendo. Si no, ejecuta:

```bash
cd Backend
npm run dev
```

**Verificar que está funcionando:**
- El servidor debe estar en `http://localhost:3001`
- Deberías ver logs de conexión en la consola

### **2. Frontend**

El frontend ya debería estar corriendo. Si no, ejecuta:

```bash
cd Frontend/frontend
npm run dev
```

**Verificar que está funcionando:**
- El servidor debe estar en `http://localhost:5173`
- Abre el navegador y ve a esa URL

---

## 🔍 Verificación del Sistema

### **Paso 1: Verificar que el backend acepta conexiones WebSocket**

Abre la consola del navegador en tu frontend y ejecuta:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Conectado al WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del WebSocket');
});
```

### **Paso 2: Verificar los nuevos endpoints**

#### Test 1: Verificar proximidad de la unidad (desde Postman o curl)

```bash
curl -X POST http://localhost:3001/api/uso-intencion/verificar-proximidad-unidad \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CONDUCTOR_TOKEN" \
  -d '{"latitud": -0.186543, "longitud": -78.487654}'
```

**Respuesta esperada:**
```json
{
  "mensaje": "Verificación de proximidad completada",
  "usuariosCercanos": [],
  "totalUsuariosCercanos": 0,
  "notificacionesEnviadas": 0
}
```

#### Test 2: Verificar proximidad del usuario

```bash
curl -X POST http://localhost:3001/api/uso-intencion/verificar-proximidad-usuario/1 \
  -H "Content-Type: application/json" \
  -d '{
    "latitud": -0.186543,
    "longitud": -78.487654,
    "id_jornada": 1
  }'
```

**Respuesta esperada (cuando NO está cerca):**
```json
{
  "mensaje": "Estás a XXX metros de la unidad",
  "confirmado": false,
  "distancia": XXX
}
```

### **Paso 3: Verificar el componente del frontend**

1. Abre el navegador en `http://localhost:5173`
2. Ve a la página `/mi-viaje` (si la agregaste al router)
3. Permite el acceso a tu ubicación cuando se solicite
4. Deberías ver:
   - Estado de conexión WebSocket (verde = conectado)
   - Solicitud de permisos de ubicación

---

## 🛠️ Configuración Necesaria

### **1. Middleware de Autenticación**

El endpoint `verificarProximidadUnidad` requiere autenticación de conductor. Asegúrate de que tienes el middleware `authConductor.js`:

**Ruta:** `Backend/server/middleware/authConductor.js`

Si no existe, créalo:

```javascript
export const authConductor = (req, res, next) => {
  // Verifica el token JWT del conductor
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    // Decodificar el token y agregar el conductor al request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.conductor = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

### **2. Variables de Entorno**

Asegúrate de tener configuradas las siguientes variables en `.env`:

```env
PORT=3001
JWT_SECRET=tu_secreto_aqui
DATABASE_URL=tu_url_de_base_de_datos
```

---

## 📝 Datos de Prueba

Para probar el sistema, necesitas:

### **1. Usuario con Parada**

```sql
-- Crear una parada con coordenadas
INSERT INTO Parada (nombre_parada, latitud, longitud, id_ruta)
VALUES ('Parada Central', -0.186543, -78.487654, 1);

-- Asignar la parada al usuario
UPDATE Usuario SET id_parada = 1 WHERE id_usuario = 1;
```

### **2. Jornada Activa**

```sql
INSERT INTO Jornada (fecha, id_unidad, id_conductor, id_ruta, estado, paradas_totales)
VALUES (NOW(), 1, 1, 1, 'en_curso', 5);
```

### **3. UsoIntencion Pendiente**

```sql
INSERT INTO UsoIntencion (id_usuario, id_jornada, indicado, confirmado)
VALUES (1, 1, true, false);
```

### **4. Ubicación del Conductor**

```sql
-- Actualizar ubicación del conductor cerca de la parada
UPDATE Conductor 
SET latitud_actual = -0.186543, 
    longitud_actual = -78.487654,
    ultima_actualizacion_ubicacion = NOW()
WHERE id_conductor = 1;
```

---

## 🧪 Flujo de Prueba Completo

### **Escenario: Usuario recibe notificación cuando la unidad se acerca**

1. **Preparación:**
   - Usuario con `id_usuario = 1`
   - Parada en: `lat: -0.186543, lng: -78.487654`
   - Jornada activa con `id_jornada = 1`, `estado = 'en_curso'`
   - `UsoIntencion` con `confirmado = false`

2. **Conductor actualiza ubicación cerca de la parada:**
   ```bash
   curl -X POST http://localhost:3001/api/ubicacion/conductor/1 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "latitud": -0.186500,
       "longitud": -78.487600
     }'
   ```

3. **Verificar en el log del servidor:**
   ```
   📢 Notificación enviada a usuario 1: La unidad está a XXX metros de tu parada...
   ```

4. **Verificar en el frontend:**
   - Abre la consola del navegador
   - Deberías ver el evento WebSocket: `notificacion_usuario_1`
   - El componente `ProximityAlerts` debe mostrar la notificación

### **Escenario: Usuario confirma automáticamente cuando se acerca a la unidad**

1. **Usuario abre la app con el componente `ProximityAlerts`**

2. **El hook `useProximityVerification` envía automáticamente la ubicación del usuario**

3. **Cuando el usuario está a < 100m de la unidad:**
   - `confirmado` se actualiza a `true` en la BD
   - Usuario recibe notificación de confirmación
   - Se emite evento WebSocket: `confirmacion_uso_1`

---

## 🐛 Troubleshooting

### **Error: "authConductor is not defined"**

**Solución:** Crea el archivo `Backend/server/middleware/authConductor.js` con el código de autenticación.

### **Error: "Cannot read property 'io' of undefined"**

**Solución:** Asegúrate de que el servidor esté configurado con Socket.IO. En `server.js`:

```javascript
import { Server } from 'socket.io';
import http from 'http';

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware para pasar io a todas las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Iniciar servidor
server.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});
```

### **Error: "Usuario no encontrado" en verificación de proximidad**

**Verificar:**
1. Que el usuario existe en la BD
2. Que el `id_jornada` es correcto
3. Que existe un `UsoIntencion` para ese usuario y jornada

### **Las notificaciones no llegan al frontend**

**Verificar:**
1. Que el WebSocket está conectado (`isConnected = true`)
2. Que el canal del evento es correcto: `notificacion_usuario_${id_usuario}`
3. Que el servidor está emitiendo el evento (ver logs)

---

## 📊 Monitoreo

### **Logs del Backend**

El backend imprimirá logs cada vez que:
- Se envía una notificación de proximidad
- Se confirma un uso automáticamente
- Se actualiza la ubicación del conductor

**Ejemplo de logs:**
```
✅ Conductor guardado en BD
📢 Notificación enviada a usuario 23: La unidad está a 150 metros de tu parada (Parada Central)
✅ Ubicación actualizada correctamente
```

### **Logs del Frontend**

En la consola del navegador, verás:
```
✅ Conectado al servidor WebSocket
📢 Notificación de proximidad recibida: { mensaje: "...", distancia: 150, ... }
Verificación de proximidad: { distancia: 85, confirmado: true, ... }
```

---

## 🎯 Checklist de Despliegue

- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5173
- [ ] Socket.IO configurado y funcionando
- [ ] Middleware de autenticación `authConductor` creado
- [ ] Datos de prueba en la base de datos
- [ ] Permisos de ubicación permitidos en el navegador
- [ ] Componente `ProximityAlerts` agregado a una página
- [ ] Ruta `/mi-viaje` agregada al router (opcional)

---

## 🚀 ¡Todo Listo!

Si has completado todos los pasos anteriores, el sistema de proximidad está **completamente funcional**.

**Para probarlo:**
1. Abre el frontend
2. Ve a la página con el componente `ProximityAlerts`
3. Simula la actualización de ubicación del conductor cerca de una parada
4. ¡Deberías recibir la notificación!

---

**¿Necesitas ayuda?**  
Consulta la documentación completa en:
- `SISTEMA_PROXIMIDAD.md`
- `GUIA_RAPIDA_PROXIMIDAD.md`
- `RESUMEN_IMPLEMENTACION.md`
