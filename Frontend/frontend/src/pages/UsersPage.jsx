import { useEffect, useState, useMemo } from 'react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles, getRutas, getParadasByRuta } from '../services/api.js';


export default function UsersPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [paradas, setParadas] = useState([]);
    const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
    const [editing, setEditing] = useState(null);


    const load = async () => {
        const [u, r, ru] = await Promise.all([getUsuarios(), getRoles(), getRutas()]);
        setUsuarios(u.data);
        setRoles(r.data);
        setRutas(ru.data);
    };


    useEffect(() => { load(); }, []);

    const handleRouteChange = async (idRuta) => {
        setForm(prev => ({ ...prev, id_ruta: idRuta, id_parada: '' }));
        if (!idRuta) { setParadas([]); return; }

        // Opción A: usar endpoint dedicado
        try {
            const res = await getParadasByRuta(idRuta);
            setParadas(res.data);
        } catch (_) {
            // Opción B (fallback): derivar de rutas ya cargadas
            const r = rutas.find(x => String(x.id_ruta) === String(idRuta));
            setParadas(r?.stops || []);
        }
    };
    const rutaNameById = useMemo(() => {
        const map = {};
        rutas.forEach(r => { map[String(r.id_ruta)] = r.nombre_ruta; });
        return map;
    }, [rutas]);
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.correo || !form.id_rol || !form.telefono || !form.contrasena) return alert('Nombre, Correo,  Rol, contraseña y telefono son obligatorios');
        const payload = { ...form };
        if (!payload.id_ruta) payload.id_ruta = null;
        if (!payload.id_parada) payload.id_parada = null;

        if (editing) {
            await updateUsuario(editing.id_usuario, form);
        } else {
            await createUsuario(form);
        }
        setForm({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
        setEditing(null);
        setParadas([]);
        load();
    };


    const onEdit = async (u) => {
        setEditing(u);
        setForm({ nombre: u.nombre, correo: u.correo, telefono: u.telefono, contrasena: '', id_rol: u.id_rol, id_ruta: u.id_ruta || '', id_parada: u.id_parada || '' });

        if (u.id_ruta) {
            await handleRouteChange(String(u.id_ruta)); // carga paradas para esa ruta
        } else {
            setParadas([]);
        }
    };

    const onDelete = async (id) => {
        if (confirm('¿Eliminar usuario?')) { await deleteUsuario(id); load(); }
    };


    return (
        <div className="container">
            <h2>Usuarios</h2>
            <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                <input placeholder="Correo" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
                <input placeholder="Contraseña" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} />
                <input placeholder="telefono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                <select value={form.id_rol} onChange={e => setForm({ ...form, id_rol: e.target.value })}>
                    <option value="">-- Rol --</option>
                    {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
                </select >
                <select value={form.id_ruta} onChange={e => handleRouteChange(e.target.value)}>
                    <option value="">-- Rutas --</option>
                    {rutas.map(r => <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>)}
                </select>
                <select value={form.id_parada} onChange={e => setForm({ ...form, id_parada: e.target.value })} disabled={!form.id_ruta || paradas.length === 0}>
                    <option value="">-- Parada (opcional) --</option>
                    {paradas.map(p => <option key={p.id_parada} value={p.id_parada}>{p.nombre_parada}</option>)}
                </select>
                <button type="submit">{editing ? 'Actualizar' : 'Crear'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm({ nombre: '', correo: '', contrasena: '', id_rol: '' }); }}>Cancelar</button>}
            </form>
            <table className="table">
                <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Telefono</th><th>Rol</th><th>Ruta</th><th>Parada</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id_usuario}>
                            <td>{u.id_usuario}</td>
                            <td>{u.nombre}</td>
                            <td>{u.correo}</td>
                            <td>{u.telefono}</td>
                            <td>{u.Role?.nombre || u.id_rol}</td>
                            <td>{u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-'}</td>
                            <td>{u.Parada?.nombre_parada || (u.id_parada || '-')}</td>
                            <td>
                                <button onClick={() => onEdit(u)}>Editar</button>
                                <button onClick={() => onDelete(u.id_usuario)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}