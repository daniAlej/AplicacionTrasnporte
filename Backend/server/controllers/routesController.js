import { Ruta, RutaCoord, Parada, Usuario } from '../models/index.js';


export const listRutas = async (req, res) => {
    const rutas = await Ruta.findAll({
        include: [
            { model: RutaCoord, as: 'coords', separate: true, order: [['orden', 'ASC']] },
            { model: Parada, as: 'stops', separate: true },
            { model: Usuario, as: 'usuarios' }
        ],
        order: [['id_ruta', 'DESC']]
    });
    if (!rutas) return res.status(404).json({ error: 'Rutas no encontrada' });
    res.json(rutas);
};


export const getRuta = async (req, res) => {
    const r = await Ruta.findByPk(req.params.id, {
        include: [
            { model: RutaCoord, as: 'coords', order: [['orden', 'ASC']] },
            { model: Parada, as: 'stops' },
            { model: Usuario, as: 'usuarios' }
        ]
    });
    if (!r) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(r);
};
export const listParadasByRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const stops = await Parada.findAll({ where: { id_ruta: id }, order: [['id_parada', 'ASC']] });
    res.json(stops);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const createRuta = async (req, res) => {
    try {
        const { nombre_ruta, coords = [], stops = [], id_usuario = null } = req.body;
        const ruta = await Ruta.create({ nombre_ruta });


        if (Array.isArray(coords) && coords.length) {
            const withOrder = coords.map((c, i) => ({ id_ruta: ruta.id_ruta, lat: c.lat, lng: c.lng, orden: c.orden ?? i + 1 }));
            await RutaCoord.bulkCreate(withOrder);
        }
        if (Array.isArray(stops) && stops.length) {
            const mapped = stops.map((s) => ({ id_ruta: ruta.id_ruta, nombre_parada: s.nombre_parada || s.nombre || `Parada`, lat: s.lat, lng: s.lng }));
            await Parada.bulkCreate(mapped);
        }


        if (id_usuario) {
            const u = await Usuario.findByPk(id_usuario);
            if (u) { u.id_ruta = ruta.id_ruta; await u.save(); }
        }


        const full = await Ruta.findByPk(ruta.id_ruta, { include: [{ model: RutaCoord, as: 'coords' }, { model: Parada, as: 'stops' }, { model: Usuario, as: 'usuarios' }] });
        res.status(201).json(full);
    } catch (e) {
         res.status(500).json({ error: e.message });
    }
};


export const updateRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_ruta, coords, stops, id_usuario } = req.body;
        const ruta = await Ruta.findByPk(id);
        if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' })
    }catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const ruta = await Ruta.findByPk(id);
        if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
        await RutaCoord.destroy({ where: { id_ruta: ruta.id_ruta } });
        await Parada.destroy({ where: { id_ruta: ruta.id_ruta } });
        await ruta.destroy();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}