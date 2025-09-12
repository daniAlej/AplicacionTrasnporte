import { useEffect, useState } from 'react';
import { getRutas, createRuta, deleteRuta, getUsuarios } from '../services/api.js';
import MapEditor from '../components/MapEditor.jsx';


export default function RoutesPage() {
    const [rutas, setRutas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ nombre_ruta: '', id_usuario: '' });
    const [mapData, setMapData] = useState({ coords: [], stops: [] });


    const load = async () => {
        const [r, u] = await Promise.all([getRutas(), getUsuarios()]);
        setRutas(r.data);
        setUsuarios(u.data);
    };
    useEffect(() => { load(); }, []);


    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre_ruta) return alert('Nombre de ruta es requerido');
        if (mapData.coords.length === 0) return alert('Dibuja la polyline de la ruta');
        await createRuta({ ...form, coords: mapData.coords, stops: mapData.stops });
        setForm({ nombre_ruta: '', id_usuario: '' });
        setMapData({ coords: [], stops: [] });
        load();
    };
    const onDelete = async (id) => {
        if (confirm('¿Eliminar ruta?')) { await deleteRuta(id); load(); }
    };


    return (
        <div className="container">
            <h2>Rutas</h2>
            <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input placeholder="Nombre de la ruta" value={form.nombre_ruta} onChange={e => setForm({ ...form, nombre_ruta: e.target.value })} />
                <select value={form.id_usuario} onChange={e => setForm({ ...form, id_usuario: e.target.value })}>
                    <option value="">-- Asignar a usuario (opcional) --</option>
                    {usuarios.map(u => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} ({u.correo})</option>)}
                </select>
                <button type="submit">Guardar Ruta</button>
            </form>
            <MapEditor onCapture={setMapData} />


            <h3 style={{ marginTop: 16 }}>Rutas existentes</h3>
            <table className="table">
                <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Usuarios asignados</th><th>#Coords</th><th>#Paradas</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    {rutas.map(r => (
                        <tr key={r.id_ruta}>
                            <td>{r.id_ruta}</td>
                            <td>{r.nombre_ruta}</td>
                            <td>{Array.isArray(r.usuarios) ? r.usuarios.length : 0}</td>
                            <td>{r.coords?.length || 0}</td>
                            <td>{r.stops?.length || 0}</td>
                            <td>
                                <button onClick={() => onDelete(r.id_ruta)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}