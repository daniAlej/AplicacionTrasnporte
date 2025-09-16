import { Institucion, Contratos } from '../models/index.js';

export const listInstituciones = async (req, res) => {
    try {
        const data = await Institucion.findAll({ include: [Contratos], order: [['id_institucion', 'DESC']] });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createInstitucion = async (req, res) => {
    try {
        const { nombre_institucion, direccion, telefono, id_admin } = req.body;
        const inst = await Institucion.create({ nombre_institucion, direccion, telefono, id_admin });
        res.status(201).json(inst);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateInstitucion = async (req, res) => {
    try {
        const inst = await Institucion.findByPk(req.params.id);
        if (!inst) return res.status(404).json({ error: 'Institución no encontrada' });
        Object.assign(inst, req.body);
        await inst.save();
        res.json(inst);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteInstitucion = async (req, res) => {
    try {
        const inst = await Institucion.findByPk(req.params.id);
        if (!inst) return res.status(404).json({ error: 'Institución no encontrada' });
        await inst.destroy();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};