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