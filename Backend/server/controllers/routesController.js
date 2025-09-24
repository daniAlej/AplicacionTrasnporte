import { Ruta, RutaCoord, Parada, Usuario } from '../models/index.js';
import sequelize from '../db.js';

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


// ACTUALIZAR (ahora con transacción)
export const updateRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_ruta, coords, stops, id_usuario } = req.body;

        const ruta = await Ruta.findByPk(id);
        if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

        const t = await sequelize.transaction();
        try {
            // Nombre
            if (nombre_ruta) {
                ruta.nombre_ruta = nombre_ruta;
                await ruta.save({ transaction: t });
            }

            // Coords (reemplazo total si envías array)
            if (Array.isArray(coords)) {
                await RutaCoord.destroy({ where: { id_ruta: id }, transaction: t });
                if (coords.length) {
                    const newCoords = coords.map((c, i) => ({
                        id_ruta: id,
                        lat: Number(c.lat),
                        lng: Number(c.lng),
                        orden: c.orden || i + 1
                    }));
                    await RutaCoord.bulkCreate(newCoords, { transaction: t });
                }
            }

            // Paradas (reemplazo total si envías array)
            if (Array.isArray(stops)) {
                await Parada.destroy({ where: { id_ruta: id }, transaction: t });
                if (stops.length) {
                    const newStops = stops.map((s) => ({
                        id_ruta: id,
                        nombre_parada: s.nombre_parada || s.nombre || 'Parada',
                        lat: Number(s.lat),
                        lng: Number(s.lng)
                    }));
                    await Parada.bulkCreate(newStops, { transaction: t });
                }
            }

            // Asignar usuario a la ruta (opcional)
            if (id_usuario) {
                const usuario = await Usuario.findByPk(id_usuario, { transaction: t });
                if (usuario) {
                    usuario.id_ruta = id;
                    await usuario.save({ transaction: t });
                }
            }

            await t.commit();

            const updatedRuta = await Ruta.findByPk(id, {
                include: [
                    { model: RutaCoord, as: 'coords', separate: true, order: [['orden', 'ASC']] },
                    { model: Parada, as: 'stops', separate: true, order: [['id_parada', 'ASC']] },
                    { model: Usuario, as: 'usuarios' }
                ]
            });
            res.json(updatedRuta);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (e) {
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