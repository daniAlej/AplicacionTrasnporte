import { UsoIntencion, Usuario, Unidad, Jornada, Parada, Ruta } from '../models/index.js';


export const listUsos = async (req, res) => {
    try {
        const data = await UsoIntencion.findAll({ include: [{
            model: Usuario, attributes: ['id_usuario', 'nombre','correo'],
            include: [{ model: Parada, attributes: ['id_parada', 'nombre_parada'] },{ model: Ruta, attributes: ['id_ruta', 'nombre_ruta'] }]
        },
         {
            model: Jornada, attributes: [ 'id_jornada','fecha','id_unidad' ],
            include: [{ model: Unidad, attributes: ['id_unidad', 'placa'] }]
        }], order: [['id_uso', 'DESC']] });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createUso = async (req, res) => {
    try {
        const { id_usuario, id_unidad, id_jornada, indicado = null, confirmado = false } = req.body; // id_jornada = 'YYYY-MM-DD'
        const u = await UsoIntencion.create({ id_usuario, id_unidad, id_jornada, indicado, confirmado });
        res.status(201).json(u);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateUso = async (req, res) => {
    try {
        const u = await UsoIntencion.findByPk(req.params.id);
        if (!u) return res.status(404).json({ error: 'UsoIntencion no encontrado' });
        Object.assign(u, req.body);
        await u.save();
        res.json(u);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteUso = async (req, res) => {
    try {
        const u = await UsoIntencion.findByPk(req.params.id);
        if (!u) return res.status(404).json({ error: 'UsoIntencion no encontrado' });
        await u.destroy();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};