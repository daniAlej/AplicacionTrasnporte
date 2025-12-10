import { Jornada, ParadaVisita, Conductor, Unidad, Ruta, Parada } from '../models/index.js';
import { Op } from 'sequelize';

// Función auxiliar para calcular la distancia entre dos puntos (fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}

// Listar jornadas
export const listJornadas = async (req, res) => {
    try {
        const data = await Jornada.findAll({
            include: [
                { model: Unidad, attributes: ['id_ruta'] },
                { model: Conductor, attributes: ['nombre'] },
                { model: Ruta, attributes: ['nombre_ruta'] }
            ],
            order: [['fecha', 'DESC']]
        });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Crear jornada básica (legacy)
export const createJornada = async (req, res) => {
    try {
        const { fecha, id_unidad } = req.body;
        const j = await Jornada.create({ fecha, id_unidad });
        res.status(201).json(j);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Eliminar jornada
export const deleteJornada = async (req, res) => {
    try {
        const j = await Jornada.findByPk(req.params.id);
        if (!j) return res.status(404).json({ error: 'Jornada no encontrada' });
        await j.destroy();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Iniciar una nueva jornada
export const iniciarJornada = async (req, res) => {
    try {
        const { id_conductor } = req.conductor || req.body;
        const { id_unidad, id_ruta } = req.body;

        // Verificar que el conductor existe
        const conductor = await Conductor.findByPk(id_conductor);
        if (!conductor) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }

        // Verificar si ya hay una jornada activa para este conductor hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const jornadaActiva = await Jornada.findOne({
            where: {
                id_conductor,
                estado: { [Op.in]: ['pendiente', 'en_curso'] },
                fecha: { [Op.gte]: today }
            }
        });

        if (jornadaActiva) {
            return res.status(400).json({ error: 'Ya existe una jornada activa para este conductor', jornada: jornadaActiva });
        }

        // Obtener paradas de la ruta
        const paradas = await Parada.findAll({
            where: { id_ruta },
            order: [['orden', 'ASC']]
        });

        // Crear la jornada
        const jornada = await Jornada.create({
            fecha: new Date(),
            id_unidad,
            id_conductor,
            id_ruta,
            hora_inicio: new Date(),
            estado: 'en_curso',
            paradas_totales: paradas.length,
            paradas_completadas: 0
        });

        // Crear registros de paradas visitadas con estado 'pendiente'
        for (const parada of paradas) {
            await ParadaVisita.create({
                id_jornada: jornada.id_jornada,
                id_parada: parada.id_parada,
                id_conductor,
                estado: 'pendiente'
            });
        }

        res.status(201).json({
            message: 'Jornada iniciada exitosamente',
            jornada,
            paradas: paradas.length
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

// Confirmar llegada a una parada
export const confirmarParada = async (req, res) => {
    try {
        const { id_conductor } = req.conductor || req.body;
        const { id_parada, latitud, longitud } = req.body;

        // Obtener la jornada activa del conductor
        const jornada = await Jornada.findOne({
            where: {
                id_conductor,
                estado: 'en_curso'
            },
            include: [{ model: Ruta }]
        });

        if (!jornada) {
            return res.status(404).json({ error: 'No hay jornada activa' });
        }

        // Obtener la parada
        const parada = await Parada.findByPk(id_parada);
        if (!parada) {
            return res.status(404).json({ error: 'Parada no encontrada' });
        }

        // Calcular distancia entre la ubicación actual y la parada
        const distancia = calcularDistancia(
            latitud,
            longitud,
            parseFloat(parada.lat),
            parseFloat(parada.lng)
        );

        const RADIO_ACEPTACION = 50; // 50 metros de radio

        if (distancia > RADIO_ACEPTACION) {
            return res.status(400).json({
                error: 'Está muy lejos de la parada',
                distancia: Math.round(distancia),
                radio_aceptacion: RADIO_ACEPTACION
            });
        }

        // Buscar el registro de parada visita
        const paradaVisita = await ParadaVisita.findOne({
            where: {
                id_jornada: jornada.id_jornada,
                id_parada,
                estado: 'pendiente'
            }
        });

        if (!paradaVisita) {
            return res.status(404).json({ error: 'Esta parada ya fue confirmada o no pertenece a la jornada' });
        }

        // Actualizar parada visita
        paradaVisita.fecha_hora_llegada = new Date();
        paradaVisita.fecha_hora_confirmacion = new Date();
        paradaVisita.latitud_confirmacion = latitud;
        paradaVisita.longitud_confirmacion = longitud;
        paradaVisita.distancia_metros = distancia;
        paradaVisita.estado = 'confirmada';
        paradaVisita.orden_visita = jornada.paradas_completadas + 1;
        await paradaVisita.save();

        // Actualizar contador de paradas completadas en la jornada
        jornada.paradas_completadas += 1;
        await jornada.save();

        // Verificar si es la última parada
        const esUltimaParada = jornada.paradas_completadas >= jornada.paradas_totales;

        res.json({
            message: 'Parada confirmada exitosamente',
            paradaVisita,
            esUltimaParada,
            paradas_completadas: jornada.paradas_completadas,
            paradas_totales: jornada.paradas_totales
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

// Finalizar jornada
export const finalizarJornada = async (req, res) => {
    try {
        const { id_conductor } = req.conductor || req.body;
        const { latitud, longitud } = req.body;

        const jornada = await Jornada.findOne({
            where: {
                id_conductor,
                estado: 'en_curso'
            }
        });

        if (!jornada) {
            return res.status(404).json({ error: 'No hay jornada activa' });
        }

        // Verificar si todas las paradas fueron completadas
        if (jornada.paradas_completadas < jornada.paradas_totales) {
            return res.status(400).json({
                error: 'No se han completado todas las paradas',
                paradas_completadas: jornada.paradas_completadas,
                paradas_totales: jornada.paradas_totales
            });
        }

        // Finalizar jornada
        jornada.hora_fin = new Date();
        jornada.latitud_fin = latitud;
        jornada.longitud_fin = longitud;
        jornada.estado = 'completada';
        await jornada.save();

        res.json({
            message: 'Jornada finalizada exitosamente',
            jornada
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

// Obtener jornada activa del conductor
export const getJornadaActiva = async (req, res) => {
    try {
        const { id_conductor } = req.conductor || req.params;

        const jornada = await Jornada.findOne({
            where: {
                id_conductor,
                estado: { [Op.in]: ['pendiente', 'en_curso'] }
            },
            include: [
                { model: Ruta, include: [{ model: Parada, as: 'stops' }] },
                { model: Unidad },
                {
                    model: ParadaVisita,
                    include: [{ model: Parada }],
                    order: [['orden_visita', 'ASC']]
                }
            ],
            order: [['fecha', 'DESC']]
        });

        res.json(jornada);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

// Obtener paradas pendientes de une jornada
export const getParadasPendientes = async (req, res) => {
    try {
        const { id_jornada } = req.params;

        const paradas = await ParadaVisita.findAll({
            where: {
                id_jornada,
                estado: 'pendiente'
            },
            include: [{ model: Parada }],
            order: [[Parada, 'orden', 'ASC']]
        });

        res.json(paradas);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

// Verificar proximidad a parada (para alertas)
export const verificarProximidadParada = async (req, res) => {
    try {
        const { id_conductor } = req.conductor || req.body;
        const { latitud, longitud } = req.body;

        const jornada = await Jornada.findOne({
            where: {
                id_conductor,
                estado: 'en_curso'
            }
        });

        if (!jornada) {
            return res.json({ proximoAParada: false });
        }

        // Obtener paradas pendientes
        const paradasPendientes = await ParadaVisita.findAll({
            where: {
                id_jornada: jornada.id_jornada,
                estado: 'pendiente'
            },
            include: [{ model: Parada }],
            order: [[Parada, 'orden', 'ASC']]
        });

        if (paradasPendientes.length === 0) {
            return res.json({ proximoAParada: false, todasCompletadas: true });
        }

        // Verificar si está cerca de alguna parada pendiente
        const RADIO_PROXIMIDAD = 200; // 200 metros
        let paradaCercana = null;
        let distanciaMinima = Infinity;

        for (const pv of paradasPendientes) {
            const distancia = calcularDistancia(
                latitud,
                longitud,
                parseFloat(pv.Parada.lat),
                parseFloat(pv.Parada.lng)
            );

            if (distancia < distanciaMinima) {
                distanciaMinima = distancia;
                if (distancia <= RADIO_PROXIMIDAD) {
                    paradaCercana = {
                        id_parada: pv.Parada.id_parada,
                        nombre_parada: pv.Parada.nombre_parada,
                        distancia: Math.round(distancia)
                    };
                }
            }
        }

        res.json({
            proximoAParada: paradaCercana !== null,
            paradaCercana,
            distanciaMinima: Math.round(distanciaMinima)
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};
