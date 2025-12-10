# 🧪 Guía de Pruebas en Postman - Sistema de Proximidad

## ⚙️ Configuración

**URL Base del Backend:** `http://localhost:8000`

---

## 📝 **Paso 1: Crear Datos de Prueba**

### **1.1. Crear una Parada con Coordenadas**

```sql
INSERT INTO Parada (nombre_parada, latitud, longitud, id_ruta, direccion, orden)
VALUES ('Parada Central', -0.186543, -78.487654, 3, 'Av. Principal', 1);
```

*Nota: Guarda el `id_parada` que se genera (ej: 1)*

### **1.2. Asignar la Parada al Usuario**

```sql
UPDATE Usuario 
SET id_parada = 1  -- Usar el ID de la parada creada
WHERE id_usuario = 6;
```

### **1.3. Crear una Jornada Activa**

```sql
INSERT INTO Jornada (fecha, id_unidad, id_conductor, id_ruta, estado, paradas_totales)
VALUES (NOW(), 1, 1, 3, 'en_curso', 5);
```

*Nota: Guarda el `id_jornada` que se genera (ej: 1)*

### **1.4. Crear un UsoIntencion Pendiente**

```sql
INSERT INTO UsoIntencion (id_usuario, id_jornada, indicado, confirmado)
VALUES (6, 1, true, false);  -- Usuario 6, Jornada 1, NO confirmado
```

### **1.5. Actualizar Ubicación del Conductor**

```sql
UPDATE Conductor 
SET latitud_actual = -0.186543, 
    longitud_actual = -78.487654,
    ultima_actualizacion_ubicacion = NOW()
WHERE id_conductor = 1;
```

---

## 🚀 **Paso 2: Probar en Postman**

### **✅ Prueba 1: Verificar Proximidad de la Unidad (200m)**

**Endpoint:** `POST http://localhost:8000/api/uso-intencion/verificar-proximidad-unidad`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_DE_CONDUCTOR
```

**Body (raw JSON):**
```json
{
  "latitud": -0.186500,
  "longitud": -78.487600
}
```

**Respuesta Esperada:**
```json
{
  "mensaje": "Verificación de proximidad completada",
  "usuariosCercanos": [
    {
      "id_uso": 1,
      "id_usuario": 6,
      "nombre_usuario": "Usuario Demo",
      "nombre_parada": "Parada Central",
      "distancia": 50,
      "requiereNotificacion": true
    }
  ],
  "totalUsuariosCercanos": 1,
  "notificacionesEnviadas": 1
}
```

---

### **✅ Prueba 2: Verificar Proximidad del Usuario (100m)**

**Endpoint:** `POST http://localhost:8000/api/uso-intencion/verificar-proximidad-usuario/6`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "latitud": -0.186500,
  "longitud": -78.487600,
  "id_jornada": 1
}
```

**Respuesta Esperada (cuando está CERCA - < 100m):**
```json
{
  "mensaje": "Uso confirmado automáticamente. ¡Estás muy cerca de la unidad!",
  "confirmado": true,
  "distancia": 50,
  "id_uso": 1,
  "dentroDelRango": true,
  "ubicacionUnidad": {
    "latitud": -0.186543,
    "longitud": -78.487654
  }
}
```

**Respuesta Esperada (cuando está LEJOS - > 100m):**
```json
{
  "mensaje": "Estás a 500 metros de la unidad",
  "confirmado": false,
  "distancia": 500,
  "id_uso": 1,
  "dentroDelRango": false,
  "ubicacionUnidad": {
    "latitud": -0.186543,
    "longitud": -78.487654
  }
}
```

---

### **✅ Prueba 3: Obtener Usos con Información de Proximidad**

**Endpoint:** `GET http://localhost:8000/api/uso-intencion/con-proximidad/6?latitud=-0.186500&longitud=-78.487600`

**Headers:**
```
Content-Type: application/json
```

**Respuesta Esperada:**
```json
[
  {
    "id_uso": 1,
    "id_usuario": 6,
    "id_jornada": 1,
    "indicado": true,
    "confirmado": false,
    "Usuario": {
      "id_usuario": 6,
      "nombre": "Usuario Demo",
      "Parada": {
        "id_parada": 1,
        "nombre_parada": "Parada Central",
        "latitud": -0.186543,
        "longitud": -78.487654
      }
    },
    "Jornada": {
      "id_jornada": 1,
      "fecha": "2025-12-09",
      "Conductor": {
        "id_conductor": 1,
        "nombre": "Conductor Demo",
        "latitud_actual": -0.186543,
        "longitud_actual": -78.487654
      }
    },
    "distanciaAUnidad": 50,
    "puedeConfirmar": true
  }
]
```

---

## 🎯 **Escenarios de Prueba Completos**

### **Escenario 1: Usuario recibe notificación (200m)**

**Objetivo:** El conductor actualiza su ubicación cerca de la parada, y el usuario debe recibir una notificación.

**Pasos:**

1. **Crear datos de prueba** (Paso 1 completo)

2. **Actualizar ubicación del conductor cerca de la parada:**
   ```
   POST http://localhost:8000/api/ubicacion/conductor/1
   Headers: Authorization: Bearer TOKEN
   Body:
   {
     "latitud": -0.186500,
     "longitud": -78.487600
   }
   ```

3. **Verificar en el log del servidor:**
   Deberías ver:
   ```
   📢 Notificación enviada a usuario 6: La unidad está a XX metros de tu parada (Parada Central)
   ```

4. **Verificar en el frontend:**
   - Abre la consola del navegador
   - Deberías ver el evento WebSocket: `notificacion_usuario_6`

---

### **Escenario 2: Usuario confirma automáticamente (100m)**

**Objetivo:** El usuario actualiza su ubicación cerca de la unidad, y su uso se confirma automáticamente.

**Pasos:**

1. **Asegúrate de tener un UsoIntencion con `confirmado = false`:**
   ```sql
   SELECT * FROM UsoIntencion WHERE id_usuario = 6 AND id_jornada = 1;
   -- confirmado debe ser false
   ```

2. **Enviar ubicación del usuario CERCA de la unidad:**
   ```
   POST http://localhost:8000/api/uso-intencion/verificar-proximidad-usuario/6
   Body:
   {
     "latitud": -0.186550,
     "longitud": -78.487650,
     "id_jornada": 1
   }
   ```

3. **Verificar la respuesta:**
   ```json
   {
     "mensaje": "Uso confirmado automáticamente...",
     "confirmado": true,
     "distancia": 50
   }
   ```

4. **Verificar en la base de datos:**
   ```sql
   SELECT * FROM UsoIntencion WHERE id_usuario = 6 AND id_jornada = 1;
   -- confirmado ahora debe ser true
   ```

---

## 🔍 **Verificar que Aparezca un Viaje Activo en la Página**

Para que aparezca un viaje activo en `/mi-viaje`, necesitas:

### **1. Verificar que existe el UsoIntencion:**

```sql
SELECT 
    ui.id_uso,
    ui.id_usuario, 
    ui.id_jornada,
    ui.confirmado,
    j.id_jornada,
    j.fecha,
    j.estado,
    u.placa
FROM UsoIntencion ui
JOIN Jornada j ON ui.id_jornada = j.id_jornada
JOIN Unidad u ON j.id_unidad = u.id_unidad
WHERE ui.id_usuario = 6
  AND ui.confirmado = false
ORDER BY ui.id_uso DESC
LIMIT 1;
```

**Si no devuelve resultados**, necesitas crear los datos del Paso 1.

### **2. Probar el endpoint directamente:**

```
GET http://localhost:8000/api/uso-intencion?id_usuario=6
```

**Debería devolver algo así:**
```json
[
  {
    "id_uso": 1,
    "id_usuario": 6,
    "id_jornada": 1,
    "indicado": true,
    "confirmado": false,
    "Usuario": { ... },
    "Jornada": {
      "id_jornada": 1,
      "fecha": "2025-12-09",
      "id_unidad": 1,
      "Unidad": { "id_unidad": 1, "placa": "ABC-123" }
    }
  }
]
```

---

## 🛠️ **Solución de Problemas Comunes**

### **❌ Error: "No hay viajes activos"**

**Causas:**
1. No existe un `UsoIntencion` con `confirmado = false` para el usuario
2. La jornada no existe o no tiene la estructura correcta
3. El endpoint no está devolviendo datos

**Solución:**
1. Ejecuta las queries del **Paso 1**
2. Verifica con:
   ```
   GET http://localhost:8000/api/uso-intencion
   ```
3. Revisa la consola del navegador para ver si hay errores de CORS

---

### **❌ Error: "CORS"**

Si ves un error de CORS en la consola del navegador:

**Solución:** Asegúrate de que en `Backend/server.js` tienes:

```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

### **❌ Error: "requireConductorAuth is not defined"**

El endpoint `verificar-proximidad-unidad` requiere autenticación de conductor.

**Opciones:**

1. **Agregar un token válido:**
   - Inicia sesión como conductor
   - Copia el Bearer Token
   - Agrégalo en los Headers de Postman

2. **Temporalmente quitar la autenticación para pruebas:**
   En `Backend/server/routes/UsoIntencion.js`:
   ```javascript
   // SOLO PARA PRUEBAS - Comentar la autenticación
   // router.post('/verificar-proximidad-unidad', requireConductorAuth, verificarProximidadUnidad);
   router.post('/verificar-proximidad-unidad', verificarProximidadUnidad);
   ```

---

## 📊 **Coordenadas de Ejemplo**

Para tus pruebas, usa estas coordenadas (cerca de Quito):

**Parada Central:**
- Latitud: `-0.186543`
- Longitud: `-78.487654`

**Conductor cerca (50 metros):**
- Latitud: `-0.186500`
- Longitud: `-78.487600`

**Usuario cerca (80 metros):**
- Latitud: `-0.186550`
- Longitud: `-78.487650`

**Usuario lejos (500 metros):**
- Latitud: `-0.190000`
- Longitud: `-78.490000`

---

## ✅ **Checklist de Pruebas**

- [ ] Datos de prueba creados (Paso 1)
- [ ] Endpoint `verificar-proximidad-unidad` funciona
- [ ] Endpoint `verificar-proximidad-usuario` funciona
- [ ] Endpoint `con-proximidad` funciona
- [ ] Aparece viaje activo en `/mi-viaje`
- [ ] WebSocket conectado (ver estado en la UI)
- [ ] Notificaciones se reciben en el frontend

---

**¿Necesitas ayuda con algún paso específico?** 🤔
