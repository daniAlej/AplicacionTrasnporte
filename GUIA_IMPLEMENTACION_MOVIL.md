# 📱 Guía de Implementación - Sistema de Proximidad en Aplicación Móvil

## 🎯 Objetivo
Implementar la verificación automática de proximidad entre usuarios y unidades (buses) para confirmar el uso del transporte cuando el usuario esté cerca.

---

## 📋 Requisitos Previos

### Permisos Necesarios (React Native):
```javascript
// En tu AndroidManifest.xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />

// Para iOS, en Info.plist:
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para confirmar tu viaje cuando estés cerca del bus</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Necesitamos rastrear tu ubicación para confirmar automáticamente tu uso del transporte</string>
```

### Librerías Recomendadas:
```bash
# Geolocalización
npm install react-native-geolocation-service
# O si usas Expo:
npx expo install expo-location

# Cliente HTTP (si no lo tienes)
npm install axios
```

---

## 🔧 Implementación Paso a Paso

### **1. Configurar el Cliente API**

Crea o actualiza `services/api.js` en tu app móvil:

```javascript
import axios from 'axios';

// IMPORTANTE: Cambia esta URL por la IP de tu servidor
const API_BASE_URL = 'http://192.168.5.48:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Endpoints de Proximidad
export const verificarProximidadUsuario = async (idUsuario, ubicacion) => {
    try {
        const response = await api.post(
            `/usointencion/verificar-proximidad-usuario/${idUsuario}`,
            {
                latitud: ubicacion.latitude,
                longitud: ubicacion.longitude,
                id_jornada: ubicacion.id_jornada
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error verificando proximidad:', error);
        throw error;
    }
};

export const verificarProximidadUnidad = async (token, ubicacion) => {
    try {
        const response = await api.post(
            '/usointencion/verificar-proximidad-unidad',
            {
                latitud: ubicacion.latitude,
                longitud: ubicacion.longitude
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error verificando proximidad unidad:', error);
        throw error;
    }
};

export const getUsosConProximidad = async (idUsuario, ubicacion) => {
    try {
        const response = await api.get(
            `/usointencion/con-proximidad/${idUsuario}`,
            {
                params: {
                    latitud: ubicacion.latitude,
                    longitud: ubicacion.longitude
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error obteniendo usos con proximidad:', error);
        throw error;
    }
};

export default api;
```

---

### **2. Crear Hook de Geolocalización**

Crea `hooks/useLocation.js`:

```javascript
import { useState, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';
// O si usas Expo:
// import * as Location from 'expo-location';

export const useLocation = (options = {}) => {
    const {
        enableHighAccuracy = true,
        timeout = 15000,
        maximumAge = 10000,
        distanceFilter = 10, // Actualizar cada 10 metros
        interval = 5000 // Actualizar cada 5 segundos
    } = options;

    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let watchId;

        const startWatching = async () => {
            try {
                // Solicitar permisos
                const granted = await requestLocationPermission();
                
                if (!granted) {
                    setError('Permisos de ubicación denegados');
                    setLoading(false);
                    return;
                }

                // Obtener ubicación inicial
                Geolocation.getCurrentPosition(
                    (position) => {
                        setLocation(position.coords);
                        setLoading(false);
                    },
                    (err) => {
                        setError(err.message);
                        setLoading(false);
                    },
                    { enableHighAccuracy, timeout, maximumAge }
                );

                // Observar cambios de ubicación
                watchId = Geolocation.watchPosition(
                    (position) => {
                        setLocation(position.coords);
                        setError(null);
                    },
                    (err) => {
                        setError(err.message);
                    },
                    {
                        enableHighAccuracy,
                        distanceFilter,
                        interval
                    }
                );
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        startWatching();

        return () => {
            if (watchId) {
                Geolocation.clearWatch(watchId);
            }
        };
    }, []);

    return { location, error, loading };
};

// Función auxiliar para solicitar permisos
const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
    }

    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
};
```

---

### **3. Crear Hook de Verificación de Proximidad**

Crea `hooks/useProximityTracking.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { verificarProximidadUsuario } from '../services/api';
import { useLocation } from './useLocation';

export const useProximityTracking = (idUsuario, idJornada, enabled = true) => {
    const { location } = useLocation();
    const [proximityData, setProximityData] = useState({
        distancia: null,
        confirmado: false,
        mensaje: '',
        dentroDelRango: false
    });
    const [isChecking, setIsChecking] = useState(false);

    const verificarProximidad = useCallback(async () => {
        if (!enabled || !location || !idUsuario || !idJornada) {
            return;
        }

        setIsChecking(true);

        try {
            const data = await verificarProximidadUsuario(idUsuario, {
                latitude: location.latitude,
                longitude: location.longitude,
                id_jornada: idJornada
            });

            setProximityData({
                distancia: data.distancia,
                confirmado: data.confirmado,
                mensaje: data.mensaje,
                dentroDelRango: data.dentroDelRango
            });

            // Si se confirmó, mostrar notificación
            if (data.confirmado && !proximityData.confirmado) {
                console.log('✅ ¡Uso confirmado automáticamente!');
                // Aquí puedes mostrar una notificación local
            }

        } catch (error) {
            console.error('Error verificando proximidad:', error);
        } finally {
            setIsChecking(false);
        }
    }, [location, idUsuario, idJornada, enabled]);

    // Verificar cada 10 segundos
    useEffect(() => {
        if (!enabled || proximityData.confirmado) {
            return;
        }

        verificarProximidad();

        const interval = setInterval(() => {
            verificarProximidad();
        }, 10000); // 10 segundos

        return () => clearInterval(interval);
    }, [enabled, proximityData.confirmado, verificarProximidad]);

    return {
        ...proximityData,
        isChecking,
        verificarProximidad
    };
};
```

---

### **4. Usar en tu Pantalla de Viaje Activo**

Ejemplo `screens/MiViajeScreen.js`:

```javascript
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useProximityTracking } from '../hooks/useProximityTracking';

const MiViajeScreen = ({ route }) => {
    const { idUsuario, idJornada } = route.params;

    const {
        distancia,
        confirmado,
        mensaje,
        dentroDelRango,
        isChecking
    } = useProximityTracking(idUsuario, idJornada, true);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi Viaje Activo</Text>

            {confirmado ? (
                <View style={styles.confirmadoContainer}>
                    <Text style={styles.confirmadoIcon}>✅</Text>
                    <Text style={styles.confirmadoText}>
                        ¡Tu viaje ha sido confirmado!
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.distanciaContainer}>
                        <Text style={styles.distanciaLabel}>
                            Distancia a la unidad:
                        </Text>
                        <Text style={styles.distanciaValor}>
                            {distancia ? `${distancia}m` : 'Calculando...'}
                        </Text>
                    </View>

                    <Text style={styles.mensaje}>
                        {mensaje || 'Esperando ubicación...'}
                    </Text>

                    {dentroDelRango && (
                        <View style={styles.alertaContainer}>
                            <Text style={styles.alertaText}>
                                🔔 La unidad está cerca. Tu viaje se confirmará automáticamente.
                            </Text>
                        </View>
                    )}

                    {isChecking && (
                        <ActivityIndicator size="small" color="#667eea" />
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    confirmadoContainer: {
        backgroundColor: '#d4edda',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 20
    },
    confirmadoIcon: {
        fontSize: 60,
        marginBottom: 10
    },
    confirmadoText: {
        fontSize: 18,
        color: '#155724',
        fontWeight: 'bold'
    },
    distanciaContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginVertical: 10,
        alignItems: 'center'
    },
    distanciaLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5
    },
    distanciaValor: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#667eea'
    },
    mensaje: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginVertical: 10
    },
    alertaContainer: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 8,
        marginTop: 20
    },
    alertaText: {
        color: '#856404',
        textAlign: 'center'
    }
});

export default MiViajeScreen;
```

---

## 🧪 Pruebas

### **Probar en Dispositivo Real:**
1. El emulador no simula GPS real, usa un dispositivo físico
2. Cambia `http://192.168.5.48:8000` a la IP de tu servidor
3. Asegúrate de estar en la misma red Wi-Fi

### **Simular Ubicación (para desarrollo):**
```javascript
// En useLocation.js, para pruebas:
const MOCK_LOCATION = {
    latitude: -0.186550,
    longitude: -78.487650
};

// Usar en lugar de Geolocation.getCurrentPosition en modo desarrollo
```

---

## ✅ Checklist de Implementación

- [ ] Cliente API configurado con endpoints de proximidad
- [ ] Hook de geolocalización funcionando
- [ ] Permisos de ubicación solicitados correctamente
- [ ] Hook de tracking de proximidad implementado
- [ ] Pantalla de viaje activo actualizada
- [ ] Probado en dispositivo real con ubicación real
- [ ] Confirmación automática funcionando correctamente
- [ ] Notificaciones locales implementadas (opcional)

---

## 📚 Recursos Adicionales

- [React Native Geolocation](https://github.com/Agontuk/react-native-geolocation-service)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native Permissions](https://github.com/zoontek/react-native-permissions)

---

## 🐛 Problemas Comunes

### Error: "Location permission denied"
**Solución:** Verificar permisos en AndroidManifest.xml / Info.plist

### Error: "Network request failed"
**Solución:** Verificar que la IP del servidor sea accesible desde el dispositivo móvil

### La ubicación no se actualiza
**Solución:** Aumentar el `distanceFilter` o reducir el `interval`

---

**¿Necesitas ayuda implementando esto en tu aplicación móvil?** 🚀
