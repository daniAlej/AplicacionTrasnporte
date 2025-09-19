import { Contratos, Institucion } from '../models/index.js';

export const listContratos = async (req, res) => {
    try {
        const data = await Contratos.findAll({ include: [Institucion], order: [['id_contratos', 'DESC']] });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createContrato = async (req, res) => {
    try {
        const { fecha_inicio, fecha_final, descripcion, id_institucion } = req.body;
        const c = await Contratos.create({ fecha_inicio, fecha_final, descripcion, id_institucion });
        res.status(201).json(c);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateContrato = async (req, res) => {
    try {
        const c = await Contratos.findByPk(req.params.id);
        if (!c) return res.status(404).json({ error: 'Contrato no encontrado' });
        Object.assign(c, req.body);
        await c.save();
        res.json(c);
    } catch (e) { res.status(500).json({ error: e.message }); }
};
export const deleteContrato = async (req, res) => {
  try {
    const c = await Contratos.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: 'Contrato no encontrado' });
    await c.destroy();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};