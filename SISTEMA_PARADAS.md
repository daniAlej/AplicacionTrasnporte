# Sistema de Seguimento de Paradas y Jornadas

## Resumen de Cambios Implementados

Se han implementado las siguientes funcionalidades para el seguimiento de paradas y control de jornadas:

### 1. Nuevos Modelos de Base de Datos

#### **ParadaVisita** (`ParadaVisita.js`)
Nuevo modelo para registrar cada visita del conductor a una parada durante una jornada:

- `id_parada_visita`: ID único
- `id_jornada`: Referencia a la jornada
- `id_parada`: Parada visitada
- `id_conductor`: Conductor que visitó
- `fecha_hora_llegada`: Timestamp de llegada
- `fecha_hora_confirmacion`: Timestamp de confirmación
- `latitud_confirmacion`, `longitud_confirmacion`: Ubicación donde se confirmó
- `distancia_metros`: Distancia real a la parada al confirmar
- `estado`: `pendiente`, `confirmada`, `omitida`, `expirada`
- `orden_visita`: Orden en que se visitó
- `tiempo_espera_segundos`: Tiempo de espera en la parada

#### **Jornada** (Actualizado)
Se añadieron nuevos campos al modelo existente:

- `id_conductor`: Conductor asignado
- `id_ruta`: Ruta asignada
- `hora_inicio`, `hora_fin`: Timestamps de inicio y fin
- `latitud_fin`, `longitud_fin`: Ubicación donde finalizó
- `estado`: `pendiente`, `en_curso`, `completada`, `cancelada`
- `paradas_completadas`: Contador de paradas confirmadas
- `paradas_totales`: Total de paradas en la ruta

### 2. Controlador de Jornadas (`JornadaController.js`)

#### **Nuevos Endpoints**:

1. **POST `/api/jornadas/iniciar`** (requiere auth de conductor)
   - Inicia una nueva jornada para el conductor
   - Valida que no haya jornada activa
   - Obtiene las paradas de la ruta
   - Crea registros de `ParadaVisita` para cada parada en estado `pendiente`
   
   ```json
   Cuerpo de la solicitud:
   {
     "id_unidad": 1,
     "id_ruta": 1
   }
   ```

2. **POST `/api/jornadas/confirmar-parada`** (requiere auth de conductor)
   - Confirma que el conductor llegó a una parada
   - Valida la distancia usando la fórmula de **Haversine** (radio de 100m)
   - Actualiza el estado de la parada a `confirmada`
   - Incrementa el contador de paradas completadas
   - Verifica si es la última parada
   
   ```json
   Cuerpo de la solicitud:
   {
     "id_parada": 5,
     "latitud": -0.186543,
     "longitud": -78.487654
   }
   ```

3. **POST `/api/jornadas/finalizar`** (requiere auth de conductor)
   - Finaliza la jornada actual
   - Valida que todas las paradas estén completadas
   - Marca la jornada como `completada`
   - Guarda la ubicación final
   
   ```json
   Cuerpo de la solicitud:
   {
     "latitud": -0.186543,
     "longitud": -78.487654
   }
   ```

4. **GET `/api/jornadas/activa/:id_conductor`**
   - Obtiene la jornada activa de un conductor
   - Incluye: ruta, paradas, visitas realizadas

5. **GET `/api/jornadas/:id_jornada/paradas-pendientes`**
   - Lista las paradas pendientes de confirmación en una jornada

6. **POST `/api/jornadas/verificar-proximidad`** (requiere auth de conductor)
   - Verifica si el conductor está cerca de alguna parada (radio 200m)
   - Útil para mostrar alertas en la app móvil
   
   ```json
   Cuerpo de la solicitud:
   {
     "latitud": -0.186543,
     "longitud": -78.487654
   }
   ```

### 3. Actualización del Controlador de Ubicación

El endpointPOST `/api/ubicacion/conductor/:id_conductor`** fue actualizado para:
- Verificar si hay jornada activa antes de actualizar ubicación
- Retornar `jornadaActiva` y `jornadaCompletada` en la respuesta
- Permitir tracking de ubicación incluso después de completar la jornada

### 4. Función de Cálculo de Distancia (Haversine)

Implementada en `JornadaController.js`:

```javascript
function calcularDistancia(lat1, lon1, lat2, lon2)
```

- Calcula la distancia en metros entre dos puntos geográficos
- Utilizada para validar que el conductor esté dentro del radio de aceptación de una parada (100m)
- También usada para verificar proximidad (200m) para alertas

### 5. Relaciones de Base de Datos

En `models/index.js` se agregaron las siguientes relaciones:

```javascript
// ParadaVisita ↔ Jornada
Jornada.hasMany(ParadaVisita, { foreignKey: 'id_jornada', onDelete: 'CASCADE' });
ParadaVisita.belongsTo(Jornada);

// ParadaVisita ↔ Parada
Parada.hasMany(ParadaVisita);
ParadaVisita.belongsTo(Parada);

// ParadaVisita ↔ Conductor
Conductor.hasMany(ParadaVisita);
ParadaVisita.belongsTo(Conductor);

// Jornada ↔ Conductor
Conductor.hasMany(Jornada);
Jornada.belongsTo(Conductor);

// Jornada ↔ Ruta
Ruta.hasMany(Jornada);
Jornada.belongsTo(Ruta);
```

## Flujo de Trabajo

### Flujo típico de una jornada:

1. **Inicio de Jornada**
   - El conductor hace login
   - Inicia jornada con POST a `/api/jornadas/iniciar`
   - El sistema crea la jornada y todas las `ParadaVisita` en estado `pendiente`

2. **Durante la Ruta**
   - El conductor envía su ubicación periódicamente a `/api/ubicacion/conductor/:id`
   - La app verifica proximidad con `/api/jornadas/verificar-proximidad`
   - Cuando está cerca de una parada (< 200m), se muestra alerta
   - Cuando está muy cerca (< 100m), puede confirmar con `/api/jornadas/confirmar-parada`

3. **Confirmación de Parada**
   - El conductor confirma llegada a la parada
   - El sistema valida la distancia
   - Si está dentro del radio (100m), confirma la parada
   - Incrementa el contador de paradas completadas

4. **Finalización**
   - Al confirmar la última parada, el sistema indica `esUltimaParada: true `
   - El conductor finaliza la jornada con `/api/jornadas/finalizar`
   - El sistema verifica que todas las paradas estén completadas
   - Marca la jornada como `completada`

## Configuración

### Radio de Aceptación
- **Confirmación de parada**: 100 metros
- **Alerta de proximidad**: 200 metros

Estos valores pueden ajustarse en el controlador:
```javascript
const RADIO_ACEPTACION = 100; // línea 161
const RADIO_PROXIMIDAD = 200; // línea 308
```

## Próximos Pasos (Recomendados)

1. **Frontend Móvil para Conductor**:
   - Implementar UI para confirmar paradas
   - Mostrar alertas cuando esté cerca de paradas
   - Botón para finalizar jornada

2. **Panel de Administración**:
   - Vista de jornadas en tiempo real
   - Historial de paradas visitadas vs omitidas
   - Reportes de cumplimiento de rutas

3. **Sistema de Tiempo Límite**:
   - Implementar timeout para confirmación de paradas
   - Marcar como `expirada` si no se confirma en X tiempo

4. **Notificaciones Push**:
   - Alertar cuando el conductor se desvíe de la ruta
   - Notificar a pasajeros cuando el bus esté cerca

## Migración de Base de Datos

El sistema utilizará `sequelize.sync({ alter: true })` que está configurado en `models/index.js`.

Al reiniciar el backend, las tablas se crearán/actualizarán automáticamente. Sin embargo, para producción se recomienda crear migraciones manuales.
