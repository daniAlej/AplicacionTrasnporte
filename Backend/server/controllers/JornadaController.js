
import { Jornada, Ruta } from '../models/index.js';

export const listJornadas = async (req, res) => {
    try {
        const data = await Jornada.findAll({ include: [], order: [['fecha', 'DESC']] });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createJornada = async (req, res) => {
    try {
        const { fecha } = req.body; // fecha en YYYY-MM-DD
        const j = await Jornada.create({ fecha });
        res.status(201).json(j);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteJornada = async (req, res) => {
    try {
        const j = await Jornada.findByPk(req.params.fecha);
        if (!j) return res.status(404).json({ error: 'Jornada no encontrada' });
        await j.destroy();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const iniciarJornada = async (req, res) => {
    try {
        const { id_unidad } = req.conductor;
        const fecha = new Date();
        // Obtiene la diferencia de zona horaria en minutos y la convierte a milisegundos
        const timezoneOffset = fecha.getTimezoneOffset() * 60000;
        // Resta la diferencia de la hora UTC para obtener la hora local correcta
        const localDate = new Date(fecha.getTime() - timezoneOffset);
        const jornada = await Jornada.create({ fecha: localDate, id_unidad });
        res.status(201).json(jornada);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
