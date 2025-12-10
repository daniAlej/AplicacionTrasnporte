import React, { useState, useEffect } from 'react';
import ProximityAlerts from '../components/ProximityAlerts';

/**
 * Página de ejemplo para mostrar el viaje del usuario con
 * notificaciones de proximidad y confirmación automática
 */
const MiViajePage = () => {
    // Datos del usuario (normalmente vendrían de un contexto o estado global)
    const [usuario, setUsuario] = useState({
        id_usuario: 6,
        nombre: 'Usuario Demo',
        id_ruta: 3
    });

    // Jornada activa (debería obtenerse del backend)
    const [jornadaActiva, setJornadaActiva] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Obtener la jornada activa al cargar la página
    useEffect(() => {
        const obtenerJornadaActiva = async () => {
            try {
                // Aquí deberías llamar a tu API para obtener la jornada activa
                // Por ahora, usamos datos de ejemplo
                const response = await fetch(`http://localhost:8000/api/uso-intencion?id_usuario=${usuario.id_usuario}`);
                const data = await response.json();

                // Buscar la jornada activa (último UsoIntencion no confirmado)
                const usoActivo = data.find(uso => !uso.confirmado);

                if (usoActivo && usoActivo.Jornada) {
                    setJornadaActiva(usoActivo.Jornada);
                }
            } catch (error) {
                console.error('Error obteniendo jornada activa:', error);
            } finally {
                setCargando(false);
            }
        };

        obtenerJornadaActiva();
    }, [usuario.id_usuario]);

    if (cargando) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

            {/* Componente de alertas de proximidad */}
            {jornadaActiva && (
                <ProximityAlerts
                    idUsuario={usuario.id_usuario}
                    idJornada={jornadaActiva.id_jornada}
                />
            )}

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Mi Viaje</h1>
                <p style={styles.subtitle}>Bienvenido, {usuario.nombre}</p>
            </div>

            {/* Contenido principal */}
            <div style={styles.content}>
                {jornadaActiva ? (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>🚍 Viaje en Curso</h2>
                            <span style={styles.badge}>Activo</span>
                        </div>

                        <div style={styles.infoGrid}>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Jornada</span>
                                <span style={styles.infoValue}>#{jornadaActiva.id_jornada}</span>
                            </div>

                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Unidad</span>
                                <span style={styles.infoValue}>
                                    {jornadaActiva.Unidad?.placa || 'N/A'}
                                </span>
                            </div>

                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Fecha</span>
                                <span style={styles.infoValue}>
                                    {new Date(jornadaActiva.fecha).toLocaleDateString()}
                                </span>
                            </div>

                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Estado</span>
                                <span style={styles.infoValue}>
                                    {jornadaActiva.estado || 'En curso'}
                                </span>
                            </div>
                        </div>

                        <div style={styles.instructions}>
                            <h3 style={styles.instructionsTitle}>📱 Instrucciones</h3>
                            <ul style={styles.instructionsList}>
                                <li>✅ Mantén la app abierta para recibir notificaciones</li>
                                <li>✅ Permite el acceso a tu ubicación</li>
                                <li>✅ Recibirás una alerta cuando la unidad esté cerca (200m)</li>
                                <li>✅ Tu uso se confirmará automáticamente cuando estés a menos de 100m de la unidad</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div style={styles.card}>
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>🚌</div>
                            <h2 style={styles.emptyTitle}>No hay viajes activos</h2>
                            <p style={styles.emptyDescription}>
                                Cuando tengas un viaje programado, verás la información aquí y recibirás notificaciones cuando la unidad se acerque.
                            </p>
                        </div>
                    </div>
                )}

                {/* Información adicional */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>💡 ¿Cómo funciona?</h3>
                    <div style={styles.featuresList}>
                        <div style={styles.feature}>
                            <div style={styles.featureIcon}>📍</div>
                            <div>
                                <h4 style={styles.featureTitle}>Notificación de Proximidad</h4>
                                <p style={styles.featureDescription}>
                                    Cuando la unidad esté a menos de 200 metros de tu parada, recibirás una notificación indicando la distancia exacta.
                                </p>
                            </div>
                        </div>

                        <div style={styles.feature}>
                            <div style={styles.featureIcon}>✅</div>
                            <div>
                                <h4 style={styles.featureTitle}>Confirmación Automática</h4>
                                <p style={styles.featureDescription}>
                                    Cuando estés a menos de 100 metros de la unidad, tu uso se confirmará automáticamente sin necesidad de hacer nada.
                                </p>
                            </div>
                        </div>

                        <div style={styles.feature}>
                            <div style={styles.featureIcon}>🔔</div>
                            <div>
                                <h4 style={styles.featureTitle}>Tiempo Real</h4>
                                <p style={styles.featureDescription}>
                                    Las notificaciones son instantáneas gracias a nuestra tecnología de comunicación en tiempo real.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Estilos
const styles = {
    container: {
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        color: 'white'
    },
    spinner: {
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    },
    header: {
        textAlign: 'center',
        color: 'white',
        marginBottom: '30px'
    },
    title: {
        fontSize: '36px',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
    },
    subtitle: {
        fontSize: '18px',
        opacity: 0.9,
        margin: 0
    },
    content: {
        maxWidth: '800px',
        margin: '0 auto'
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    cardTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2d3748',
        margin: '0 0 16px 0'
    },
    badge: {
        background: '#48bb78',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    infoLabel: {
        fontSize: '12px',
        color: '#718096',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: '0.5px'
    },
    infoValue: {
        fontSize: '18px',
        color: '#2d3748',
        fontWeight: 'bold'
    },
    instructions: {
        background: '#edf2f7',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '20px'
    },
    instructionsTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2d3748',
        margin: '0 0 12px 0'
    },
    instructionsList: {
        margin: 0,
        paddingLeft: '20px',
        color: '#4a5568'
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px 20px'
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px'
    },
    emptyTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: '12px'
    },
    emptyDescription: {
        fontSize: '16px',
        color: '#718096',
        maxWidth: '500px',
        margin: '0 auto'
    },
    featuresList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    feature: {
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
    },
    featureIcon: {
        fontSize: '32px',
        flexShrink: 0
    },
    featureTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2d3748',
        margin: '0 0 6px 0'
    },
    featureDescription: {
        fontSize: '14px',
        color: '#718096',
        margin: 0,
        lineHeight: '1.5'
    }
};

export default MiViajePage;
