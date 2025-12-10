# 🚀 Guía Rápida: Sistema de Proximidad y Confirmación Automática

## ✨ Resumen

Acabamos de implementar un sistema completo de proximidad que:

1. **Notifica automáticamente** a los usuarios cuando la unidad está a menos de 200m de su parada
2. **Confirma automáticamente** el uso cuando el usuario está a menos de 100m de la unidad
3. **Funciona en tiempo real** usando WebSockets para notificaciones instantáneas

---

## 📦 Archivos Creados/Modificados

### **Backend**

#### ✅ Controladores
- `Backend/server/controllers/UsoIntencion.js` - **Actualizado**
  - `verificarProximidadUnidad()` - Verifica proximidad de la unidad a las paradas
  - `verificarProximidadUsuario()` - Verifica proximidad del usuario y confirma uso
  - `obtenerUsosConProximidad()` - Consulta usos con información de distancia

- `Backend/server/controllers/UbicacionController.js` - **Actualizado**
  - Verificación automática de proximidad integrada en `updateConductorLocation()`
  - Envío automático de notificaciones cuando la unidad se acerca a una parada

#### ✅ Rutas
- `Backend/server/routes/UsoIntencion.js` - **Actualizado**
  - `POST /api/uso-intencion/verificar-proximidad-unidad` (Requiere auth conductor)
  - `POST /api/uso-intencion/verificar-proximidad-usuario/:id_usuario`
  - `GET /api/uso-intencion/con-proximidad/:id_usuario?latitud=X&longitud=Y`

### **Frontend**

#### ✅ Hooks Personalizados
- `Frontend/frontend/src/hooks/useProximityNotifications.js` - **Nuevo**
  - Escucha notificaciones WebSocket en tiempo real
  - Auto-limpieza de notificaciones

- `Frontend/frontend/src/hooks/useProximityVerification.js` - **Nuevo**
  - Verifica proximidad del usuario automáticamente
  - Maneja confirmación de uso

#### ✅ Componentes
- `Frontend/frontend/src/components/ProximityAlerts.jsx` - **Nuevo**
  - Muestra notificaciones de proximidad
  - Muestra confirmaciones de uso
  - Barra de estado con distancia y conexión WebSocket

### **Documentación**

- `SISTEMA_PROXIMIDAD.md` - **Nuevo**
  - Documentación técnica completa
  - Ejemplos de uso
  - Guía de integración

- `GUIA_RAPIDA_PROXIMIDAD.md` - **Este archivo**

---

## 🎯 Cómo Funciona

### **Flujo 1: Notificación cuando la unidad se acerca (200m)**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Conductor actualiza su ubicación (cada 5 segundos)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend calcula distancia a todas las paradas de usuarios   │
│    con UsoIntencion no confirmados                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Si distancia ≤ 200m → Envía notificación WebSocket          │
│    Canal: `notificacion_usuario_${id_usuario}`                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Usuario recibe notificación en su app                       │
│    "La unidad está a 150 metros de tu parada"                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Flujo 2: Confirmación automática cuando el usuario se acerca (100m)**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario abre la app y permite tracking de ubicación         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. App envía ubicación del usuario cada 10 segundos            │
│    POST /api/uso-intencion/verificar-proximidad-usuario/:id    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend calcula distancia entre usuario y unidad            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Si distancia ≤ 100m → Actualiza `confirmado = true`         │
│    en la tabla UsoIntencion                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Envía confirmación al usuario                               │
│    "Uso confirmado automáticamente"                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Cómo Usar en el Frontend

### **Opción 1: Usar el Componente Completo (Recomendado)**

```jsx
import ProximityAlerts from '../components/ProximityAlerts';

function MiViajePage() {
  const { user } = useAuth(); // Tu hook de autenticación
  const [jornadaActual, setJornadaActual] = useState(null);

  return (
    <div>
      <h1>Mi Viaje</h1>
      
      {/* Agregar el componente de alertas */}
      <ProximityAlerts 
        idUsuario={user.id_usuario} 
        idJornada={jornadaActual?.id_jornada} 
      />
      
      {/* Resto de tu UI */}
    </div>
  );
}
```

### **Opción 2: Usar los Hooks Individualmente**

```jsx
import useProximityNotifications from '../hooks/useProximityNotifications';
import useProximityVerification from '../hooks/useProximityVerification';

function MiComponente() {
  const { user } = useAuth();
  const [ubicacion, setUbicacion] = useState(null);

  // Escuchar notificaciones WebSocket
  const { 
    proximityNotification, 
    confirmationNotification 
  } = useProximityNotifications(user.id_usuario);

  // Verificar proximidad automáticamente
  const { 
    distanciaAUnidad, 
    confirmado, 
    mensaje 
  } = useProximityVerification(
    user.id_usuario, 
    user.id_jornada_actual, 
    ubicacion
  );

  // Mostrar notificación cuando se reciba
  useEffect(() => {
    if (proximityNotification) {
      alert(proximityNotification.mensaje);
    }
  }, [proximityNotification]);

  useEffect(() => {
    if (confirmationNotification) {
      alert('✅ Uso confirmado automáticamente');
    }
  }, [confirmationNotification]);

  return (
    <div>
      <p>Distancia a la unidad: {distanciaAUnidad}m</p>
      <p>Confirmado: {confirmado ? 'Sí' : 'No'}</p>
      <p>{mensaje}</p>
    </div>
  );
}
```

---

## 🧪 Cómo Probar

### **Prueba 1: Notificación de Proximidad**

1. **Crear un usuario y una parada**
   - Asegúrate de que la parada tenga coordenadas (`latitud`, `longitud`)

2. **Crear un UsoIntencion**
   ```sql
   INSERT INTO UsoIntencion (id_usuario, id_jornada, indicado, confirmado)
   VALUES (1, 1, true, false);
   ```

3. **Iniciar jornada como conductor**
   ```bash
   POST /api/jornadas/iniciar
   Body: { "id_unidad": 1, "id_ruta": 1 }
   ```

4. **Simular que el conductor se acerca a la parada**
   ```bash
   POST /api/ubicacion/conductor/1
   Body: { 
     "latitud": [latitud_cerca_de_parada], 
     "longitud": [longitud_cerca_de_parada] 
   }
   ```

5. **Verificar en el log del servidor**
   Deberías ver:
   ```
   📢 Notificación enviada a usuario 1: La unidad está a 150 metros de tu parada...
   ```

6. **Verificar en el frontend**
   Deberías recibir el evento WebSocket en `notificacion_usuario_1`

### **Prueba 2: Confirmación Automática**

1. **El usuario debe tener un UsoIntencion pendiente** (`confirmado = false`)

2. **Abrir la app del usuario**
   - El componente `ProximityAlerts` o el hook `useProximityVerification` debe estar activo

3. **Simular que el usuario está cerca de la unidad**
   ```bash
   POST /api/uso-intencion/verificar-proximidad-usuario/1
   Body: { 
     "latitud": [latitud_cerca_de_unidad],
     "longitud": [longitud_cerca_de_unidad],
     "id_jornada": 1
   }
   ```

4. **Verificar la respuesta**
   ```json
   {
     "mensaje": "Uso confirmado automáticamente...",
     "confirmado": true,
     "distancia": 85
   }
   ```

5. **Verificar en la base de datos**
   ```sql
   SELECT * FROM UsoIntencion WHERE id_usuario = 1;
   -- El campo 'confirmado' debe ser true
   ```

---

## 📊 Endpoints Disponibles

### **POST** `/api/uso-intencion/verificar-proximidad-unidad`
**Autenticación:** Conductor (Bearer Token)  
**Body:**
```json
{
  "latitud": -0.186543,
  "longitud": -78.487654
}
```

**Respuesta:**
```json
{
  "mensaje": "Verificación de proximidad completada",
  "usuariosCercanos": [...],
  "totalUsuariosCercanos": 2,
  "notificacionesEnviadas": 2
}
```

---

### **POST** `/api/uso-intencion/verificar-proximidad-usuario/:id_usuario`
**Body:**
```json
{
  "latitud": -0.186600,
  "longitud": -78.487700,
  "id_jornada": 1
}
```

**Respuesta (confirmado):**
```json
{
  "mensaje": "Uso confirmado automáticamente...",
  "confirmado": true,
  "distancia": 85,
  "dentroDelRango": true
}
```

**Respuesta (no confirmado):**
```json
{
  "mensaje": "Estás a 250 metros de la unidad",
  "confirmado": false,
  "distancia": 250,
  "dentroDelRango": false
}
```

---

### **GET** `/api/uso-intencion/con-proximidad/:id_usuario?latitud=X&longitud=Y`
**Query Params:**
- `latitud` (opcional): Latitud del usuario
- `longitud` (opcional): Longitud del usuario

**Respuesta:**
```json
[
  {
    "id_uso": 1,
    "confirmado": false,
    "distanciaAUnidad": 150,
    "puedeConfirmar": false
  }
]
```

---

## ⚙️ Configuración

### **Cambiar las distancias**

En `Backend/server/controllers/UsoIntencion.js`:
```javascript
const DISTANCIA_ALERTA = 200; // Cambiar a 300, 500, etc.
const DISTANCIA_CONFIRMACION = 100; // Cambiar a 50, 150, etc.
```

### **Cambiar el intervalo de verificación**

En el hook `useProximityVerification`:
```javascript
useProximityVerification(idUsuario, idJornada, ubicacion, {
  intervaloMs: 5000 // Cambiar a 5000 (5 seg), 15000 (15 seg), etc.
});
```

---

## 🔔 WebSocket Events

### **Eventos que el frontend debe escuchar:**

```javascript
// Notificación de proximidad
socket.on(`notificacion_usuario_${id_usuario}`, (data) => {
  console.log(data);
  // {
  //   mensaje: "La unidad está a 150 metros...",
  //   tipo: "proximidad_unidad",
  //   distancia: 150,
  //   parada: "Parada Central",
  //   timestamp: "2025-12-09T16:30:00.000Z"
  // }
});

// Confirmación de uso
socket.on(`confirmacion_uso_${id_usuario}`, (data) => {
  console.log(data);
  // {
  //   id_uso: 15,
  //   id_jornada: 5,
  //   distancia: 85,
  //   timestamp: "2025-12-09T16:35:00.000Z"
  // }
});
```

---

## 🚀 Próximos Pasos

1. **Agregar notificaciones push nativas**
   - Integrar Firebase Cloud Messaging (FCM)
   - Enviar notificaciones incluso si la app está cerrada

2. **Mejorar la UI**
   - Agregar animaciones
   - Mostrar mapa con la ubicación de la unidad

3. **Dashboard de administración**
   - Ver en tiempo real todas las notificaciones enviadas
   - Ver estadísticas de confirmaciones automáticas

4. **Optimizar batería**
   - Reducir frecuencia de verificación cuando la unidad está lejos
   - Usar geofencing para activar tracking solo cuando sea necesario

---

## 🆘 Troubleshooting

### **No se reciben notificaciones WebSocket**

- Verifica que el servidor WebSocket esté corriendo
- Verifica que el usuario se está conectando correctamente
- Revisa los logs del servidor para ver si se están emitiendo los eventos

### **La confirmación automática no funciona**

- Verifica que el `UsoIntencion` existe y tiene `confirmado = false`
- Verifica que el conductor está enviando su ubicación
- Verifica que la distancia calculada es realmente < 100m
- Revisa la respuesta del endpoint para ver la distancia exacta

### **La ubicación del usuario no se actualiza**

- Verifica que se han otorgado permisos de ubicación
- Verifica que el navegador soporta Geolocation API
- Revisa la consola del navegador para ver errores

---

## 📧 Soporte

Para más información, consulta:
- `SISTEMA_PROXIMIDAD.md` - Documentación técnica completa
- Logs del servidor (Backend)
- Consola del navegador (Frontend)

---

**¡El sistema está completamente funcional y listo para usar! 🎉**
