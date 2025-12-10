# Sistema de Proximidad y Confirmación Automática de Uso

## 📋 Resumen

Este sistema implementa la verificación automática de proximidad entre las unidades (buses) y los usuarios, permitiendo:

1. **Notificaciones automáticas** cuando la unidad se acerca a la parada del usuario (< 200m)
2. **Confirmación automática de uso** cuando el usuario está cerca de la unidad (< 100m)

---

## 🎯 Funcionalidades Principales

### 1. **Alerta de Proximidad de Unidad** (200 metros)

Cuando el conductor actualiza su ubicación y la unidad está a **menos de 200 metros** de la parada de un usuario:

- ✅ Se verifica automáticamente la distancia a todas las paradas de los usuarios con `UsoIntencion` pendientes
- ✅ Se envía una notificación al usuario indicando la distancia exacta
- ✅ Se emite un evento de WebSocket en tiempo real
- ✅ El log del servidor registra las notificaciones enviadas

**Ejemplo de notificación:**
```
"La unidad está a 150 metros de tu parada (Parada Central)"
```

### 2. **Confirmación Automática de Uso** (100 metros)

Cuando el usuario está a **menos de 100 metros** de la unidad:

- ✅ Se actualiza automáticamente el campo `confirmado` a `true` en la tabla `UsoIntencion`
- ✅ Se envía confirmación al usuario
- ✅ Se emite evento de WebSocket  de confirmación
- ✅ El uso queda registrado en el sistema

**Ejemplo de mensaje:**
```
"Uso confirmado automáticamente. ¡Estás muy cerca de la unidad!"
```

---

## 🔧 Implementación Técnica

### **Backend**

#### 1. **UsoIntencion.js Controller**

Se han añadido 3 nuevas funciones:

##### `verificarProximidadUnidad()`
```javascript
POST /api/uso-intencion/verificar-proximidad-unidad
// Autenticación: Conductor (Bearer Token)
// Body: { latitud, longitud }
```

**Flujo:**
1. Obtiene la jornada activa del conductor
2. Busca todos los `UsoIntencion` no confirmados para esa jornada
3. Calcula la distancia de la unidad a cada parada del usuario
4. Si distancia ≤ 200m → Envía notificación al usuario
5. Retorna lista de usuarios cercanos

**Respuesta:**
```json
{
  "mensaje": "Verificación de proximidad completada",
  "usuariosCercanos": [
    {
      "id_uso": 15,
      "id_usuario": 23,
      "nombre_usuario": "Juan Pérez",
      "nombre_parada": "Parada Central",
      "distancia": 150,
      "requiereNotificacion": true
    }
  ],
  "totalUsuariosCercanos": 1,
  "notificacionesEnviadas": 1
}
```

##### `verificarProximidadUsuario()`
```javascript
POST /api/uso-intencion/verificar-proximidad-usuario/:id_usuario
// Body: { latitud, longitud, id_jornada }
```

**Flujo:**
1. Busca el `UsoIntencion` del usuario para la jornada indicada
2. Obtiene la ubicación actual de la unidad (del conductor)
3. Calcula la distancia entre el usuario y la unidad
4. Si distancia ≤ 100m → Confirma automáticamente (`confirmado = true`)
5. Retorna el estado de confirmación

**Respuesta cuando se confirma:**
```json
{
  "mensaje": "Uso confirmado automáticamente. ¡Estás muy cerca de la unidad!",
  "confirmado": true,
  "distancia": 85,
  "id_uso": 15,
  "dentroDelRango": true,
  "ubicacionUnidad": {
    "latitud": -0.186543,
    "longitud": -78.487654
  }
}
```

**Respuesta cuando NO se confirma:**
```json
{
  "mensaje": "Estás a 250 metros de la unidad",
  "confirmado": false,
  "distancia": 250,
  "id_uso": 15,
  "dentroDelRango": false,
  "ubicacionUnidad": {
    "latitud": -0.186543,
    "longitud": -78.487654
  }
}
```

##### `obtenerUsosConProximidad()`
```javascript
GET /api/uso-intencion/con-proximidad/:id_usuario?latitud=X&longitud=Y
```

**Flujo:**
1. Obtiene todos los usos del usuario
2. Si se proporcionan coordenadas, calcula la distancia a cada unidad
3. Añade campos `distanciaAUnidad` y `puedeConfirmar` a cada uso

**Respuesta:**
```json
[
  {
    "id_uso": 15,
    "id_usuario": 23,
    "id_jornada": 5,
    "confirmado": false,
    "distanciaAUnidad": 85,
    "puedeConfirmar": true
  }
]
```

---

#### 2. **UbicacionController.js** (Actualizado)

##### **Verificación Automática Integrada**

Cada vez que un conductor actualiza su ubicación (`POST /api/ubicacion/conductor/:id_conductor`):

1. Se guarda la nueva ubicación del conductor
2. **NUEVO:** Se buscan automáticamente todos los `UsoIntencion` no confirmados de la jornada activa
3. **NUEVO:** Se calcula la distancia a cada parada de usuario
4. **NUEVO:** Si distancia ≤ 200m → Se envía notificación automática por WebSocket
5. Se emite el evento de actualización de ubicación

**Respuesta actualizada:**
```json
{
  "message": "Ubicación del conductor actualizada",
  "latitud": -0.186543,
  "longitud": -78.487654,
  "jornadaActiva": true,
  "jornadaCompletada": false,
  "notificacionesEnviadas": 2,
  "usuariosNotificados": [
    {
      "idUsuario": 23,
      "nombreUsuario": "Juan Pérez",
      "parada": "Parada Central",
      "distancia": 150,
      "mensaje": "La unidad está a 150 metros de tu parada (Parada Central)"
    },
    {
      "idUsuario": 45,
      "nombreUsuario": "María González",
      "parada": "Parada Norte",
      "distancia": 180,
      "mensaje": "La unidad está a 180 metros de tu parada (Parada Norte)"
    }
  ]
}
```

---

#### 3. **Función de Cálculo de Distancia (Haversine)**

Se utiliza la misma función en ambos controladores:

```javascript
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}
```

**Precisión:** Muy alta para distancias cortas (<1km)

---

### **WebSocket Events**

#### Eventos emitidos por el backend:

##### 1. **Notificación de proximidad a usuario**
```javascript
req.io.emit(`notificacion_usuario_${id_usuario}`, {
  mensaje: "La unidad está a 150 metros de tu parada (Parada Central)",
  tipo: "proximidad_unidad",
  distancia: 150,
  parada: "Parada Central",
  timestamp: "2025-12-09T16:30:00.000Z"
});
```

**Canal:** `notificacion_usuario_${id_usuario}` (ejemplo: `notificacion_usuario_23`)

##### 2. **Confirmación de uso**
```javascript
req.io.emit(`confirmacion_uso_${id_usuario}`, {
  id_uso: 15,
  id_jornada: 5,
  distancia: 85,
  timestamp: "2025-12-09T16:35:00.000Z"
});
```

**Canal:** `confirmacion_uso_${id_usuario}` (ejemplo: `confirmacion_uso_23`)

---

## 🔄 Flujo Completo del Sistema

### **Escenario 1: Notificación cuando la unidad se acerca**

1. **Conductor actualiza su ubicación** (cada 5 segundos)
   ```javascript
   POST /api/ubicacion/conductor/:id_conductor
   Body: { latitud: -0.186543, longitud: -78.487654 }
   ```

2. **Backend verifica proximidad automáticamente**
   - Busca `UsoIntencion` no confirmados de la jornada activa
   - Calcula distancia a cada parada de usuario
   - Identifica usuarios a < 200m

3. **Se envían notificaciones**
   - WebSocket: `notificacion_usuario_23`
   - Usuario recibe: "La unidad está a 150 metros de tu parada"

4. **Usuario ve la notificación en la app móvil**

---

### **Escenario 2: Confirmación automática cuando el usuario se acerca**

1. **Usuario abre la app y permite tracking de ubicación**

2. **App del usuario envía su ubicación periódicamente**
   ```javascript
   POST /api/uso-intencion/verificar-proximidad-usuario/23
   Body: { 
     latitud: -0.186600, 
     longitud: -78.487700,
     id_jornada: 5
   }
   ```

3. **Backend calcula distancia entre usuario y unidad**
   - Obtiene ubicación actual del conductor
   - Calcula distancia
   - Si < 100m → Actualiza `confirmado = true`

4. **Respuesta al usuario:**
   ```json
   {
     "mensaje": "Uso confirmado automáticamente",
     "confirmado": true,
     "distancia": 85
   }
   ```

5. **Se emite evento de WebSocket:**
   ```javascript
   confirmacion_uso_23
   ```

---

## 🎨 Integración en el Frontend

### **Para la App del Usuario (React Native / Web)**

#### 1. **Escuchar notificaciones de proximidad**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Escuchar notificaciones de proximidad
socket.on(`notificacion_usuario_${id_usuario}`, (data) => {
  // Mostrar notificación al usuario
  Alert.alert(
    '🚍 La unidad se acerca',
    data.mensaje,
    [{ text: 'OK' }]
  );
  
  // También puedes mostrar una notificación push nativa
  sendLocalNotification(data.mensaje);
});

// Escuchar confirmaciones de uso
socket.on(`confirmacion_uso_${id_usuario}`, (data) => {
  Alert.alert(
    '✅ Uso confirmado',
    `Tu uso ha sido confirmado automáticamente`,
    [{ text: 'OK' }]
  );
});
```

#### 2. **Enviar ubicación del usuario para verificar proximidad**

```javascript
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

const useProximityVerification = (idUsuario, idJornada) => {
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    // Solicitar permisos de ubicación
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (!locationPermission) return;

    // Verificar proximidad cada 10 segundos
    const intervalo = setInterval(async () => {
      const location = await Location.getCurrentPositionAsync({});
      
      try {
        const response = await fetch(
          `${API_URL}/api/uso-intencion/verificar-proximidad-usuario/${idUsuario}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitud: location.coords.latitude,
              longitud: location.coords.longitude,
              id_jornada: idJornada
            })
          }
        );

        const data = await response.json();
        
        if (data.confirmado) {
          // Mostrar mensaje de confirmación
          Alert.alert('✅ Uso confirmado', data.mensaje);
          // Detener verificación (ya se confirmó)
          clearInterval(intervalo);
        } else {
          // Mostrar distancia actual
          console.log(`Distancia a la unidad: ${data.distancia}m`);
        }
      } catch (error) {
        console.error('Error verificando proximidad:', error);
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(intervalo);
  }, [locationPermission, idUsuario, idJornada]);
};

export default useProximityVerification;
```

#### 3. **Uso en un componente**

```javascript
import useProximityVerification from './useProximityVerification';

const MiViajeScreen = () => {
  const { user } = useAuth();
  const [jornadaActual, setJornadaActual] = useState(null);

  // Activar verificación de proximidad
  useProximityVerification(user.id_usuario, jornadaActual?.id_jornada);

  return (
    <View>
      <Text>Estado de tu viaje</Text>
      {/* ... resto de la UI ... */}
    </View>
  );
};
```

---

### **Para la App del Conductor**

No requiere cambios adicionales. La verificación automática está integrada en el endpoint de actualización de ubicación que ya estás usando.

---

## 📊 Constantes Configurables

En **UsoIntencion.js**:
```javascript
const DISTANCIA_ALERTA = 200; // metros - Alerta cuando la unidad se acerca a la parada
const DISTANCIA_CONFIRMACION = 100; // metros - Confirma que el usuario usó la unidad
```

Puedes ajustar estos valores según tus necesidades.

---

## 🧪 Pruebas

### **Probar notificaciones de proximidad:**

1. Crea un `UsoIntencion` para un usuario
2. Asegúrate de que la jornada esté activa (`estado = 'en_curso'`)
3. Actualiza la ubicación del conductor cerca de la parada del usuario
4. Verifica que se emita el evento WebSocket

### **Probar confirmación automática:**

1. Simula que el usuario está cerca de la unidad
2. Envía la ubicación del usuario:
   ```bash
   curl -X POST http://localhost:3001/api/uso-intencion/verificar-proximidad-usuario/23 \
   -H "Content-Type: application/json" \
   -d '{"latitud": -0.186543, "longitud": -78.487654, "id_jornada": 5}'
   ```
3. Verifica que `confirmado` se actualice a `true` en la base de datos

---

## 🚀 Próximos Pasos Recomendados

1. **Notificaciones Push Nativas**
   - Integrar Firebase Cloud Messaging (FCM) para Android
   - Integrar Apple Push Notification Service (APNS) para iOS
   - Enviar notificaciones incluso si la app está en background

2. **Historial de Notificaciones**
   - Crear tabla `NotificacionUsuario` para registrar todas las notificaciones enviadas
   - Permitir al usuario ver historial de notificaciones

3. **Configuración por Usuario**
   - Permitir que el usuario active/desactive notificaciones
   - Permitir ajustar la distancia de alerta (100m, 200m, 500m)

4. **Dashboard de Admin**
   - Ver en tiempo real qué usuarios han recibido notificaciones
   - Ver estadísticas de confirmaciones automáticas vs manuales

---

## 📝 Notas Importantes

- ✅ **Privacidad:** Solo se trackea la ubicación cuando hay una jornada activa
- ✅ **Performance:** Las verificaciones son eficientes y no afectan el rendimiento
- ✅ **Precisión:** La fórmula de Haversine es muy precisa para distancias cortas
- ✅ **Tiempo real:** Los eventos de WebSocket son instantáneos
- ⚠️ **Batería:** El tracking continuo puede consumir batería (optimiza intervalos)

---

## 🆘 Solución de Problemas

### **Las notificaciones no se envían**

1. Verifica que hay una jornada activa con `estado = 'en_curso'`
2. Verifica que los usuarios tienen `UsoIntencion` con `confirmado = false`
3. Verifica que las paradas tienen coordenadas (`latitud`, `longitud`)
4. Revisa los logs del servidor para ver si se detectan usuarios cercanos

### **La confirmación automática no funciona**

1. Verifica que el conductor está enviando su ubicación
2. Verifica que el `UsoIntencion` existe y tiene `confirmado = false`
3. Verifica que la distancia es realmente < 100m
4. Revisa la respuesta del endpoint para ver la distancia calculada

---

## 📧 Soporte

Para más ayuda, consulta los logs del servidor o contacta al equipo de desarrollo.
