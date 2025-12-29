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
            <h2>🗺️ Gestión de Rutas</h2>

            <form onSubmit={onSubmit}>
                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="nombre_ruta">Nombre de la Ruta</label>
                        <input
                            id="nombre_ruta"
                            placeholder="Ej: Ruta Central 1"
                            value={form.nombre_ruta}
                            onChange={e => setForm({ ...form, nombre_ruta: e.target.value })}
                        />
                    </div>
                </div>

                {editing && (
                    <div className="alert info" style={{ marginBottom: 16 }}>
                        <strong>💡 Consejo:</strong> Dibuja o edita en el mapa y luego pulsa <strong>📍 Capturar Ruta</strong> para actualizar los datos antes de guardar.
                    </div>
                )}

                <div className="form-actions">
                    {editing && (
                        <button type="button" className="secondary" onClick={resetAll}>
                            ❌ Cancelar
                        </button>
                    )}
                    <button type="submit" disabled={loading}>
                        {editing ? `💾 Actualizar Ruta #${editing.id_ruta}` : '✨ Crear Nueva Ruta'}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: 24, background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)', padding: 16, boxShadow: 'var(--shadow-md)' }}>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>🗺️ Editor de Mapa</h3>
                <MapEditor
                    key={editing?.id_ruta || 'new'}
                    initialCoords={editing ? mapData.coords : []}
                    initialStops={editing ? mapData.stops : []}
                    onCapture={setMapData}
                    height={500}
                    fitOnInit={true}
                />
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 16 }}>
                📊 Rutas Registradas
                <span className="pill info" style={{ marginLeft: 12 }}>{rutas.length} rutas</span>
            </h3>

            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Usuarios</th>
                        <th>Coordenadas</th>
                        <th>Paradas</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rutas.map(r => (
                        <tr key={r.id_ruta}>
                            <td><strong>#{r.id_ruta}</strong></td>
                            <td>
                                <strong style={{ color: 'var(--text-primary)' }}>🚌 {r.nombre_ruta}</strong>
                            </td>
                            <td>
                                <span className="pill neutral">
                                    👥 {Array.isArray(r.usuarios) ? r.usuarios.length : 0}
                                </span>
                            </td>
                            <td>
                                <span className="pill info">
                                    📍 {r.coords?.length || 0} puntos
                                </span>
                            </td>
                            <td>
                                <span className="pill success">
                                    🚏 {r.stops?.length || 0} paradas
                                </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    <button onClick={() => onEdit(r)} style={{ fontSize: '13px' }}>✏️ Editar</button>
                                    <button onClick={() => onDelete(r.id_ruta)} className="danger" style={{ fontSize: '13px' }}>🗑️ Eliminar</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {rutas.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                                <div className="empty-state">
                                    <div className="empty-state-icon">🗺️</div>
                                    <div className="empty-state-title">No hay rutas registradas</div>
                                    <div className="empty-state-description">
                                        Crea tu primera ruta usando el editor de mapa.
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>


        </div>
    );
}
