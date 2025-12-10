import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook personalizado para escuchar notificaciones de proximidad
 * y confirmaciones de uso automáticas vía WebSocket
 * 
 * @param {number} idUsuario - ID del usuario
 * @param {string} serverUrl - URL del servidor (ej: 'http://localhost:3001')
 * @returns {Object} - Estado de conexión y notificaciones
 */
export const useProximityNotifications = (idUsuario, serverUrl = 'http://localhost:8000') => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [proximityNotification, setProximityNotification] = useState(null);
    const [confirmationNotification, setConfirmationNotification] = useState(null);
    const [lastNotificationTime, setLastNotificationTime] = useState(null);

    // Inicializar conexión WebSocket
    useEffect(() => {
        if (!idUsuario) return;

        const socketInstance = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketInstance.on('connect', () => {
            console.log('✅ Conectado al servidor WebSocket');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Desconectado del servidor WebSocket');
            setIsConnected(false);
        });

        // Escuchar notificaciones de proximidad de la unidad
        socketInstance.on(`notificacion_usuario_${idUsuario}`, (data) => {
            console.log('📢 Notificación de proximidad recibida:', data);
            setProximityNotification(data);
            setLastNotificationTime(new Date());

            // Auto-limpiar la notificación después de 10 segundos
            setTimeout(() => {
                setProximityNotification(null);
            }, 10000);
        });

        // Escuchar confirmaciones de uso
        socketInstance.on(`confirmacion_uso_${idUsuario}`, (data) => {
            console.log('✅ Confirmación de uso recibida:', data);
            setConfirmationNotification(data);
            setLastNotificationTime(new Date());

            // Auto-limpiar la confirmación después de 15 segundos
            setTimeout(() => {
                setConfirmationNotification(null);
            }, 15000);
        });

        setSocket(socketInstance);

        // Cleanup
        return () => {
            socketInstance.disconnect();
        };
    }, [idUsuario, serverUrl]);

    // Función para limpiar manualmente las notificaciones
    const clearNotifications = useCallback(() => {
        setProximityNotification(null);
        setConfirmationNotification(null);
    }, []);

    return {
        socket,
        isConnected,
        proximityNotification,
        confirmationNotification,
        lastNotificationTime,
        clearNotifications
    };
};

export default useProximityNotifications;
