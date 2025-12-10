import { useEffect, useState, useCallback } from 'react';

/**
 * Hook personalizado para verificar la proximidad del usuario a la unidad
 * y confirmar automáticamente el uso cuando está cerca (< 100m)
 * 
 * @param {number} idUsuario - ID del usuario
 * @param {number} idJornada - ID de la jornada activa
 * @param {Object} ubicacionUsuario - {latitud, longitud} del usuario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado de verificación y confirmación
 */
export const useProximityVerification = (
    idUsuario,
    idJornada,
    ubicacionUsuario,
    options = {}
) => {
    const {
        serverUrl = 'http://localhost:8000',
        intervaloMs = 10000, // Verificar cada 10 segundos
        autoStart = true
    } = options;

    const [verificando, setVerificando] = useState(false);
    const [distanciaAUnidad, setDistanciaAUnidad] = useState(null);
    const [confirmado, setConfirmado] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState(null);
    const [ultimaVerificacion, setUltimaVerificacion] = useState(null);

    // Función para verificar proximidad
    const verificarProximidad = useCallback(async () => {
        if (!idUsuario || !idJornada || !ubicacionUsuario?.latitud || !ubicacionUsuario?.longitud) {
            return;
        }

        setVerificando(true);
        setError(null);

        try {
            const response = await fetch(
                `${serverUrl}/api/uso-intencion/verificar-proximidad-usuario/${idUsuario}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        latitud: ubicacionUsuario.latitud,
                        longitud: ubicacionUsuario.longitud,
                        id_jornada: idJornada
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            setDistanciaAUnidad(data.distancia);
            setConfirmado(data.confirmado);
            setMensaje(data.mensaje);
            setUltimaVerificacion(new Date());

            console.log('Verificación de proximidad:', {
                distancia: data.distancia,
                confirmado: data.confirmado,
                mensaje: data.mensaje
            });

            return data;
        } catch (err) {
            console.error('Error verificando proximidad:', err);
            setError(err.message);
            return null;
        } finally {
            setVerificando(false);
        }
    }, [idUsuario, idJornada, ubicacionUsuario, serverUrl]);

    // Efecto para verificación automática periódica
    useEffect(() => {
        if (!autoStart || confirmado) return;

        // Verificar inmediatamente
        verificarProximidad();

        // Luego verificar cada intervaloMs
        const intervalo = setInterval(() => {
            verificarProximidad();
        }, intervaloMs);

        return () => clearInterval(intervalo);
    }, [autoStart, confirmado, intervaloMs, verificarProximidad]);

    // Función para detener la verificación
    const detener = useCallback(() => {
        setVerificando(false);
    }, []);

    // Función para reiniciar la verificación
    const reiniciar = useCallback(() => {
        setConfirmado(false);
        setDistanciaAUnidad(null);
        setMensaje('');
        setError(null);
        verificarProximidad();
    }, [verificarProximidad]);

    return {
        verificando,
        distanciaAUnidad,
        confirmado,
        mensaje,
        error,
        ultimaVerificacion,
        verificarProximidad,
        detener,
        reiniciar
    };
};

export default useProximityVerification;
