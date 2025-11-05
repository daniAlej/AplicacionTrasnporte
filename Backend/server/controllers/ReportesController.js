import { Reportes, Ruta, Usuario, Conductor, Unidad } from '../models/index.js';

// Listar todos los reportes con info de ruta y quién lo generó
export const listReportes = async (req, res) => {
    try {
        
        const data = await Reportes.findAll({
            include: [
                {
                    model: Ruta, attributes: ['id_ruta', 'nombre_ruta'],
                    include: [{ model: Unidad, attributes: ['id_unidad', 'placa'], required: false }]
                },
                { model: Usuario, attributes: ['id_usuario', 'nombre'], required: false },
                { model: Conductor, attributes: ['id_conductor', 'nombre'], required: false },

            ],
            order: [['id_reporte', 'DESC']]
        });

        const salida = data.map(r => ({
            id_reporte: r.id_reporte,
            tipo: r.tipo,
            descripcion: r.descripcion,
            fecha: r.fecha,
            id_ruta: r.Ruta?.id_ruta || null,
            ruta_nombre: r.Ruta?.nombre_ruta || null,
            unidad_placa: r.Ruta?.Unidad?.[0]?.placa || null,
            id_usuario: r.Usuario?.id_usuario || null,
            usuario_nombre: r.Usuario?.nombre || null,
            id_conductor: r.Conductor?.id_conductor || null,
            conductor_nombre: r.Conductor?.nombre || null,
            foto_url: r.foto_url || null,
        }));

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Crear un reporte
export const createReporte = async (req, res) => {
    try {
        const { tipo, descripcion, fecha, foto_url, id_ruta, id_usuario, id_conductor } = req.body;

        if (!tipo || !id_ruta) {
            return res.status(400).json({ error: 'tipo e id_ruta son obligatorios' });
        }

        // Validamos que venga solo un origen
        if ((id_usuario && id_conductor) || (!id_usuario && !id_conductor)) {
            return res.status(400).json({ error: 'Debe enviarse id_usuario O id_conductor' });
        }

        const nuevo = await Reportes.create({ tipo, descripcion, fecha, foto_url, id_ruta, id_usuario, id_conductor });
        res.status(201).json(nuevo);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// Eliminar un reporte
export const deleteReporte = async (req, res) => {
    try {
        const r = await Reportes.findByPk(req.params.id);
        if (!r) return res.status(404).json({ error: 'Reporte no encontrado' });
        await r.destroy();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
