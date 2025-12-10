import React, { useState, useEffect } from 'react';
import useProximityNotifications from '../hooks/useProximityNotifications';
import useProximityVerification from '../hooks/useProximityVerification';

/**
 * Componente de ejemplo para mostrar notificaciones de proximidad
 * y estado de confirmación de uso
 */
const ProximityAlerts = ({ idUsuario, idJornada }) => {
    const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
    const [permisosUbicacion, setPermisosUbicacion] = useState(false);

    // Hook para notificaciones WebSocket
    const {
        isConnected,
        proximityNotification,
        confirmationNotification,
        clearNotifications
    } = useProximityNotifications(idUsuario);

    // Hook para verificación de proximidad
    const {
        verificando,
        distanciaAUnidad,
        confirmado,
        mensaje,
        error
    } = useProximityVerification(idUsuario, idJornada, ubicacionUsuario, {
        intervaloMs: 10000, // Verificar cada 10 segundos
        autoStart: true
    });

    // Solicitar permisos de ubicación (Web Geolocation API)
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUbicacionUsuario({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude
                    });
                    setPermisosUbicacion(true);
                },
                (error) => {
                    console.error('Error obteniendo ubicación:', error);
                    alert('Por favor, permite el acceso a tu ubicación para recibir notificaciones');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );

            // Actualizar ubicación cada 5 segundos
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUbicacionUsuario({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error actualizando ubicación:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        } else {
            alert('Tu navegador no soporta geolocalización');
        }
    }, []);

    return (
        <div className="proximity-alerts">
            <style>{`
        .proximity-alerts {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
        }

        .alert {
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .alert-proximity {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .alert-confirmation {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
        }

        .alert-info {
          background: #f0f4f8;
          color: #2d3748;
          border-left: 4px solid #4299e1;
        }

        .alert-error {
          background: #fff5f5;
          color: #c53030;
          border-left: 4px solid #fc8181;
        }

        .alert-title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-message {
          font-size: 14px;
          line-height: 1.5;
        }

        .alert-distance {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.9;
        }

        .close-btn {
          float: right;
          background: transparent;
          border: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          opacity: 0.8;
        }

        .status-bar {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 12px;
        }

        .status-item {
          flex: 1;
          text-align: center;
        }

        .status-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }

        .status-value {
          font-size: 18px;
          font-weight: bold;
          color: #2d3748;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .status-dot.connected {
          background: #48bb78;
        }

        .status-dot.disconnected {
          background: #fc8181;
        }
      `}</style>

            {/* Barra de estado */}
            <div className="status-bar">
                <div className="status-item">
                    <div className="status-label">
                        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        WebSocket
                    </div>
                    <div className="status-value">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </div>
                </div>
                {distanciaAUnidad !== null && (
                    <div className="status-item">
                        <div className="status-label">Distancia</div>
                        <div className="status-value">{distanciaAUnidad}m</div>
                    </div>
                )}
                {confirmado && (
                    <div className="status-item">
                        <div className="status-label">Estado</div>
                        <div className="status-value" style={{ color: '#38a169' }}>✓ Confirmado</div>
                    </div>
                )}
            </div>

            {/* Notificación de proximidad de la unidad */}
            {proximityNotification && (
                <div className="alert alert-proximity">
                    <button className="close-btn" onClick={clearNotifications}>×</button>
                    <div className="alert-title">
                        🚍 La unidad se acerca
                    </div>
                    <div className="alert-message">
                        {proximityNotification.mensaje}
                    </div>
                    <div className="alert-distance">
                        Parada: {proximityNotification.parada} • {proximityNotification.distancia}m
                    </div>
                </div>
            )}

            {/* Notificación de confirmación de uso */}
            {confirmationNotification && (
                <div className="alert alert-confirmation">
                    <button className="close-btn" onClick={clearNotifications}>×</button>
                    <div className="alert-title">
                        ✅ Uso confirmado
                    </div>
                    <div className="alert-message">
                        Tu uso ha sido confirmado automáticamente
                    </div>
                    <div className="alert-distance">
                        Distancia: {confirmationNotification.distancia}m
                    </div>
                </div>
            )}

            {/* Mensaje de verificación */}
            {!confirmado && mensaje && !proximityNotification && (
                <div className="alert alert-info">
                    <div className="alert-message">
                        {mensaje}
                    </div>
                    {verificando && (
                        <div className="alert-distance">
                            Verificando proximidad...
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="alert alert-error">
                    <div className="alert-title">
                        ⚠️ Error
                    </div>
                    <div className="alert-message">
                        {error}
                    </div>
                </div>
            )}

            {/* Advertencia si no hay permisos de ubicación */}
            {!permisosUbicacion && (
                <div className="alert alert-info">
                    <div className="alert-title">
                        📍 Permisos de ubicación
                    </div>
                    <div className="alert-message">
                        Por favor, permite el acceso a tu ubicación para recibir notificaciones cuando la unidad esté cerca.
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProximityAlerts;
