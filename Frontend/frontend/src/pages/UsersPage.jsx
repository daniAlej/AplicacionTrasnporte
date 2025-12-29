import { useEffect, useState, useMemo, useRef } from 'react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles, getRutas, getParadasByRuta } from '../services/api.js';

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
  const [editing, setEditing] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // NUEVO: estados de filtro
  const [filterRol, setFilterRol] = useState('');
  const [filterRuta, setFilterRuta] = useState('');
  const [filterEstado, setFilterEstado] = useState('activo');

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
    setFormErrors({}); // Clear previous errors

    const payload = { ...form };
    if (!payload.id_ruta) payload.id_ruta = null;
    if (!payload.id_parada) payload.id_parada = null;

    try {
      if (editing) {
        await updateUsuario(editing.id_usuario, payload);
      } else {
        await createUsuario(payload);
      }
      setForm({ nombre: '', correo: '', contrasena: '', id_rol: '', telefono: '', id_ruta: '', id_parada: '' });
      setEditing(null);
      setParadas([]);
      load();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const backendErrors = error.response.data.errors;
        const errorMap = {};
        backendErrors.forEach(err => {
          errorMap[err.field] = err.message;
        });
        setFormErrors(errorMap);
      } else {
        alert('Ocurrió un error inesperado.');
        console.error(error);
      }
    }
  };

  const toggleEstado = async (u) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿Quieres cambiar a ${nuevoEstado} al usuario ${u.nombre}?`)) return;

    await updateUsuario(u.id_usuario, { ...u, estado: nuevoEstado });
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
    setFormErrors({});

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
      .filter(u => {
        const matchRol = !filterRol || String(u.id_rol) === String(filterRol);
        const matchRuta = !filterRuta || String(u.id_ruta ?? '') === String(filterRuta);
        const matchEstado = !filterEstado || u.estado === filterEstado;
        return matchRol && matchRuta && matchEstado;
      });
  }, [usuarios, filterRol, filterRuta, filterEstado]);

  return (
    <div className="container">
      <h2>👥 Gestión de Usuarios</h2>

      {/* Formulario de creación/edición */}
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group">
          <label htmlFor='nombre'>Nombre</label>
          <input id='nombre' placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='correo'>Correo</label>
          <input id='correo' type="email" placeholder="Correo" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
          {formErrors.correo && <small style={{ color: 'red' }}>{formErrors.correo}</small>}
        </div>
        <div className="form-group">
          <label htmlFor='contrasena'>Contraseña</label>
          <input id='contrasena' type="password" placeholder="Contraseña" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor='telefono'>Teléfono</label>
          <input id='telefono' placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          {formErrors.telefono && <small style={{ color: 'red' }}>{formErrors.telefono}</small>}
        </div>
        <div className="form-group">
          <label htmlFor='id_rol'>Rol</label>
          <select id='id_rol' value={form.id_rol} onChange={e => setForm({ ...form, id_rol: e.target.value })}>
            <option value="">-- Rol --</option>
            {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor='id_ruta'>Ruta</label>
          <select id='id_ruta' value={form.id_ruta} onChange={e => handleRouteChange(e.target.value)}>
            <option value="">-- Ruta --</option>
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
              setFormErrors({});
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {/* NUEVO: Controles de filtro */}
      <div style={{
        marginTop: 24,
        padding: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>🔍 Filtrar por:</strong>
        <select value={filterRol} onChange={e => setFilterRol(e.target.value)} style={{ flex: '1 1 200px' }}>
          <option value="">📋 Todos los roles</option>
          {roles.map(r => (
            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
          ))}
        </select>

        <select value={filterRuta} onChange={e => setFilterRuta(e.target.value)} style={{ flex: '1 1 200px' }}>
          <option value="">🚌 Todas las rutas</option>
          {rutas.map(r => (
            <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
          ))}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ flex: '1 1 200px' }}>
          <option value="">🔘 Todos los estados</option>
          <option value="activo">✅ Activos</option>
          <option value="inactivo">⛔ Inactivos</option>
        </select>

        {(filterRol || filterRuta || filterEstado) && (
          <button type="button" className="secondary" onClick={() => { setFilterRol(''); setFilterRuta(''); setFilterEstado('activo'); }}>
            🔄 Limpiar filtros
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 32, marginBottom: 16 }}>
        📊 Lista de Usuarios
        <span className="pill info" style={{ marginLeft: 12 }}>{usuariosFiltrados.length} usuarios</span>
      </h3>

      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Teléfono</th><th>Rol</th><th>Ruta</th><th>Parada</th><th>Estado</th><th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map(u => (
            <tr key={u.id_usuario}>
              <td><strong>#{u.id_usuario}</strong></td>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{u.nombre}</strong>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>📧 {u.correo}</small>
                </div>
              </td>
              <td>
                <span style={{ color: 'var(--text-secondary)' }}>📱 {u.telefono || '-'}</span>
              </td>
              <td>
                <span className="pill neutral">
                  {u.Role?.nombre || roles.find(r => r.id_rol === u.id_rol)?.nombre || u.id_rol}
                </span>
              </td>
              <td>{u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-'}</td>
              <td>{u.Parada?.nombre_parada || (u.id_parada || '-')}</td>
              <td>
                <span className={`pill ${u.estado === 'activo' ? 'success' : 'danger'}`}>
                  {u.estado === 'activo' ? '✅ Activo' : '⛔ Inactivo'}
                </span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => onEdit(u)} style={{ fontSize: '13px' }}>✏️ Editar</button>
                  <button
                    onClick={() => toggleEstado(u)}
                    className={u.estado === 'activo' ? 'warning' : 'success'}
                    style={{ fontSize: '13px' }}
                  >
                    {u.estado === 'activo' ? '⏸️ Desactivar' : '▶️ Activar'}
                  </button>
                </div>


              </td>
            </tr>
          ))}
          {usuariosFiltrados.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No hay usuarios</div>
                  <div className="empty-state-description">
                    No se encontraron usuarios con los filtros seleccionados.
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
