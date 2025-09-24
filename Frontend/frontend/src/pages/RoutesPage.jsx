// src/pages/RoutesPage.jsx
import { useEffect, useState } from 'react';
import { getRutas, createRuta, updateRuta, deleteRuta, getUsuarios } from '../services/api.js';
import MapEditor from '../components/MapEditor.jsx';

export default function RoutesPage() {
    const [rutas, setRutas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ nombre_ruta: '', id_usuario: '' });
    const [mapData, setMapData] = useState({ coords: [], stops: [] });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        const [r, u] = await Promise.all([
            getRutas(),
            getUsuarios().catch(() => ({ data: [] }))
        ]);
        setRutas(r.data || []);
        setUsuarios(u.data || []);
    };

    useEffect(() => { load(); }, []);

    const resetAll = () => {
        setEditing(null);
        setForm({ nombre_ruta: '', id_usuario: '' });
        setMapData({ coords: [], stops: [] });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre_ruta?.trim()) return alert('Nombre de ruta es requerido');

        // Para crear exigimos una polyline; para editar puedes solo cambiar nombre si quieres
        if (!editing && (!mapData.coords || mapData.coords.length === 0)) {
            return alert('Dibuja la polyline de la ruta y pulsa "📍 Capturar Ruta" antes de guardar.');
        }

        try {
            setLoading(true);
            const payload = {
                ...form,
                coords: mapData.coords || [],
                stops: mapData.stops || []
            };

            if (editing) {
                await updateRuta(editing.id_ruta, payload);
            } else {
                await createRuta(payload);
            }

            resetAll();
            await load();
        } catch (err) {
            alert(err?.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (id) => {
        if (confirm('¿Eliminar ruta?')) {
            await deleteRuta(id);
            load();
        }
    };

    const onEdit = (r) => {
        setEditing(r);
        setForm({
            nombre_ruta: r.nombre_ruta || '',
            // si asignas usuario desde aquí, toma el primero o ajusta a tu lógica
            id_usuario: r.usuarios?.[0]?.id_usuario || ''
        });

        // Prepara los datos para precargar el mapa
        const coords = (r.coords || [])
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((c, i) => ({
                lat: Number(c.lat),
                lng: Number(c.lng),
                orden: c.orden || i + 1
            }));

        const stops = (r.stops || []).map((s, i) => ({
            lat: Number(s.lat),
            lng: Number(s.lng),
            nombre_parada: s.nombre_parada || s.nombre || `Parada ${i + 1}`
        }));

        setMapData({ coords, stops });
    };

    return (
        <div className="container">
            <h2>Rutas</h2>

            <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    placeholder="Nombre de la ruta"
                    value={form.nombre_ruta}
                    onChange={e => setForm({ ...form, nombre_ruta: e.target.value })}
                />

                {/* (Opcional) reasignar usuario desde aquí
        <select
          value={form.id_usuario}
          onChange={(e) => setForm({ ...form, id_usuario: e.target.value })}
        >
          <option value="">-- (Opcional) Asignar usuario --</option>
          {usuarios.map(u => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.nombre} ({u.correo})
            </option>
          ))}
        </select>
        */}

                <button type="submit" disabled={loading}>
                    {editing ? `Guardar cambios (Ruta #${editing.id_ruta})` : 'Guardar nueva Ruta'}
                </button>

                {editing && (
                    <button type="button" onClick={resetAll}>
                        Cancelar
                    </button>
                )}
                {/* Tip UX */}
                <p style={{ marginTop: 8 }} disabled={loading}>
                    <small><b>{editing ? 'Tip:' : ''}</b> {editing ? 'Dibuja o edita en el mapa y luego pulsa': ''} <em>{editing? '📍 Capturar Ruta': ''}</em> {editing? 'para actualizar los datos antes de guardar.': ''} </small>
                </p>
            </form>

            <div style={{ marginTop: 10 }}>
                {/* IMPORTANTE:
           - key fuerza remount del mapa al entrar/salir de edición (evita residuos de capas)
           - initial* precargan polyline y paradas al editar
           - onCapture actualiza mapData cuando haces clic en "📍 Capturar Ruta" dentro del mapa
        */}
                <MapEditor
                    key={editing?.id_ruta || 'new'}
                    initialCoords={editing ? mapData.coords : []}
                    initialStops={editing ? mapData.stops : []}
                    onCapture={setMapData}
                    height={500}
                    fitOnInit={true}
                />
            </div>

            <h3 style={{ marginTop: 16 }}>Rutas existentes</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuarios asignados</th>
                        <th>#Coords</th>
                        <th>#Paradas</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rutas.map(r => (
                        <tr key={r.id_ruta}>
                            <td>{r.id_ruta}</td>
                            <td>{r.nombre_ruta}</td>
                            <td>{Array.isArray(r.usuarios) ? r.usuarios.length : 0}</td>
                            <td>{r.coords?.length || 0}</td>
                            <td>{r.stops?.length || 0}</td>
                            <td style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => onEdit(r)}>Editar</button>
                                <button onClick={() => onDelete(r.id_ruta)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            
        </div>
    );
}
