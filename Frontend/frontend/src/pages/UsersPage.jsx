import { useEffect, useState, useMemo } from 'react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles, getRutas, getParadasByRuta } from '../services/api.js';

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
  const [editing, setEditing] = useState(null);

  // NUEVO: estados de filtro
  const [filterRol, setFilterRol] = useState('');
  const [filterRuta, setFilterRuta] = useState('');

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

    try {
      const res = await getParadasByRuta(idRuta);
      setParadas(res.data);
    } catch (_) {
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
    if (!form.nombre || !form.correo || !form.id_rol || !form.telefono || !form.contrasena) {
      return alert('Nombre, Correo,  Rol, contraseña y telefono son obligatorios');
    }
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
    setForm({
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      contrasena: '',
      id_rol: u.id_rol,
      id_ruta: u.id_ruta || '',
      id_parada: u.id_parada || ''
    });

    if (u.id_ruta) {
      await handleRouteChange(String(u.id_ruta));
    } else {
      setParadas([]);
    }
  };

  const onDelete = async (id) => {
    if (confirm('¿Eliminar usuario?')) { await deleteUsuario(id); load(); }
  };

  // NUEVO: filtrar usuarios por rol y ruta
  const usuariosFiltrados = useMemo(() => {
  return usuarios
    .filter(u => u.estado === 'activo') // 👈 solo activos
    .filter(u => {
      const matchRol = !filterRol || String(u.id_rol) === String(filterRol);
      const matchRuta = !filterRuta || String(u.id_ruta ?? '') === String(filterRuta);
      return matchRol && matchRuta;
    });
}, [usuarios, filterRol, filterRuta]);

  return (
    <div className="container">
      <h2>Usuarios</h2>

      {/* Formulario de creación/edición */}
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group">
          <label htmlFor='nombre'>Nombre</label>
          <input id='nombre' placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='correo'>Correo</label>
          <input id='correo' placeholder="Correo" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='contrasena'>Contraseña</label>
          <input id='contrasena' placeholder="Contraseña" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='telefono'>Telefono</label>
          <input id='telefono' placeholder="telefono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='id_rol'>Rol</label>
          <select id='id_rol' value={form.id_rol} onChange={e => setForm({ ...form, id_rol: e.target.value })}>
            <option value="">-- Rol --</option>
            {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
          </select >
        </div>
        <div className="form-group">
          <label htmlFor='id_ruta'>Ruta</label>
          <select id='id_ruta' value={form.id_ruta} onChange={e => handleRouteChange(e.target.value)}>
            <option value="">-- Rutas --</option>
            {rutas.map(r => <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor='id_parada'>Parada</label>
          <select id='id_parada' value={form.id_parada} onChange={e => setForm({ ...form, id_parada: e.target.value })} disabled={!form.id_ruta || paradas.length === 0}>
            <option value="">-- Parada (opcional) --</option>
            {paradas.map(p => <option key={p.id_parada} value={p.id_parada}>{p.nombre_parada}</option>)}
          </select>
        </div>


        <button type="submit">{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
              setParadas([]);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {/* NUEVO: Controles de filtro */}

      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Filtrar:</strong>
        <select value={filterRol} onChange={e => setFilterRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {roles.map(r => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
          ))}
        </select>

        <select value={filterRuta} onChange={e => setFilterRuta(e.target.value)}>
          <option value="">Todas las rutas</option>
          {rutas.map(r => (
            <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
          ))}
        </select>

        {(filterRol || filterRuta) && (
          <button type="button" onClick={() => { setFilterRol(''); setFilterRuta(''); }}>
            Limpiar filtros
          </button>
        )}
      </div>
      <h3>Lista de Usuarios ({usuariosFiltrados.length})</h3>
      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Correo</th><th>Telefono</th><th>Rol</th><th>Ruta</th><th>Parada</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map(u => (
            <tr key={u.id_usuario}>
              <td>{u.id_usuario}</td>
              <td>{u.nombre}</td>
              <td>{u.correo}</td>
              <td>{u.telefono}</td>
              <td>{u.Role?.nombre || roles.find(r => r.id_rol === u.id_rol)?.nombre || u.id_rol}</td>
              <td>{u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-'}</td>
              <td>{u.Parada?.nombre_parada || (u.id_parada || '-')}</td>
              <td>
                <button onClick={() => onEdit(u)}>Editar</button>
                <button onClick={() => onDelete(u.id_usuario)}>Desactivar</button>
              </td>
            </tr>
          ))}
          {usuariosFiltrados.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', opacity: 0.7 }}>No hay usuarios para el filtro seleccionado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
