import { useEffect, useState, useMemo } from 'react';
import { getConductores, updateConductor, deleteUnidad, deleteConductor, createConductor, getUnidades, getRutas, createUnidad, updateUnidad } from '../services/api.js';


export default function UnidadesConductoresPage() {
  const [rutas, setRutas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [editingConductor, setEditingConductor] = useState(null);
  const [editingUnidad, setEditingUnidad] = useState(null);


  // Formularios
  const [unidadForm, setUnidadForm] = useState({
    placa: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: ''
  });
  const [conductorForm, setConductorForm] = useState({
    nombre: '', licencia: '', correo: '', contraseña: '', telefono: '', estado: 'activo', id_unidad: ''
  });

  const load = async () => {
    const [r, u, c] = await Promise.all([
      getRutas(), getUnidades(), getConductores()
    ]);
    setRutas(r.data);
    setUnidades(u.data);
    setConductores(c.data);
  };

  useEffect(() => { load(); }, []);

  // Unidades ya asignadas a algún conductor (para deshabilitarlas en el select)
  const unidadesOcupadas = useMemo(() => new Set(
    (conductores || []).map(c => c.id_unidad).filter(Boolean)
  ), [conductores]);

  // rutas ya asignadas a alguna unidad (para deshabilitarlas en el select)
  const rutasOcupadas = useMemo(() => new Set(
    (unidades || []).map(u => u.id_ruta).filter(Boolean)
  ), [unidades]);

  // Mapeo rápido id_ruta -> nombre_ruta desde unidades (que traen Ruta)
  const rutaNameByUnidadId = useMemo(() => {
    const map = {};
    for (const u of unidades) {
      map[u.id_unidad] = u.Ruta?.nombre_ruta || '-';
    }
    return map;
  }, [unidades]);

  // ---- Handlers Unidad ----
  const submitUnidad = async (e) => {
    e.preventDefault();
    if (!unidadForm.placa || !unidadForm.capacidad) {
      alert('Placa, Capacidad y Ruta son obligatorios'); return;
    }
    // Validar que la placa sea única
    const placaExiste = unidades.some(
      (u) => u.placa.toLowerCase() === unidadForm.placa.trim().toLowerCase()
    );
    if (placaExiste && (!editingUnidad || editingUnidad.placa !== unidadForm.placa)) {
      alert("La placa ya está registrada 🚨");
      return;
    }
    const payload = {
      placa: unidadForm.placa.trim(),
      modelo: unidadForm.modelo.trim() || null,
      capacidad: Number(unidadForm.capacidad),
      estado: unidadForm.estado,
      id_ruta: unidadForm.id_ruta ? Number(unidadForm.id_ruta) : null,
    };
    if (editingUnidad) {
      await updateUnidad(editingUnidad.id_unidad, payload);
    } else {
      await createUnidad(payload);
    }
    setUnidadForm({ placa: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: '' });
    setEditingUnidad(null);
    load();
  };
  const onEditUnidad = async (u) => {
    setEditingUnidad(u);
    setUnidadForm({
      placa: u.placa,
      modelo: u.modelo || '',
      capacidad: u.capacidad,
      estado: u.estado,
      id_ruta: u.id_ruta || ''
    });
  }
  const removeUnidad = async (id) => {
    const unidad = unidades.find(u => u.id_unidad === id);
    const conductorAsignado = conductores.find(c => c.id_unidad === id);

    if (conductorAsignado) {
      alert(`No puedes eliminar la unidad ${unidad?.placa || id} porque está asignada al conductor ${conductorAsignado.nombre}. Elimina o reasigna primero ese conductor.`);
      return;
    }

    if (!confirm(`¿Eliminar la unidad ${unidad?.placa || id}?`)) return;

    try {
      await deleteUnidad(id);
      load();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al eliminar la unidad.");
    }
  };

  const rutaNameById = useMemo(() => {
    const map = {};
    rutas.forEach(r => { map[String(r.id_ruta)] = r.nombre_ruta; });
    return map;
  }, [rutas]);
  // ---- Handlers Conductor ----
  const submitConductor = async (e) => {
    e.preventDefault();
    if (!conductorForm.nombre || !conductorForm.licencia || !conductorForm.id_unidad || !conductorForm.correo || !conductorForm.contraseña) {
      alert('Nombre, Licencia, Unidad, correo y contraseña son obligatorios'); return;
    }
    const payload = {
      nombre: conductorForm.nombre.trim(),
      licencia: conductorForm.licencia.trim(),
      correo: conductorForm.correo.trim(),
      contrasena: conductorForm.contraseña.trim(),
      telefono: conductorForm.telefono?.trim() || null,
      estado: conductorForm.estado,
      id_unidad: Number(conductorForm.id_unidad),
    };
    // Validar licencia única
    const licenciaExiste = conductores.some(
      (c) => c.licencia.toLowerCase() === conductorForm.licencia.trim().toLowerCase()
    );
    if (licenciaExiste && (!editingConductor || editingConductor.licencia !== conductorForm.licencia)) {
      alert("La licencia ya está registrada 🚨");
      return;
    }
    // Validar correo único
    const correoExiste = conductores.some(
      (c) => c.correo.toLowerCase() === conductorForm.correo.trim().toLowerCase()
    );
    if (correoExiste && (!editingConductor || editingConductor.correo !== conductorForm.correo)) {
      alert("El correo ya está registrado 🚨");
      return;
    }
    if (editingConductor) {
      await updateConductor(editingConductor.id_conductor, payload);
      setEditingConductor(null);
    } else {
      await createConductor(payload);
    }

    setConductorForm({ nombre: '', licencia: '', correo: '', contraseña: '', telefono: '', estado: 'activo', id_unidad: '' });
    setEditingConductor(null);
    load();
  };

  const onEditConductor = async (c) => {
    setEditingConductor(c);
    setConductorForm({
      nombre: c.nombre,
      licencia: c.licencia,
      correo: c.correo,
      contraseña: '',
      telefono: c.telefono || '',
      estado: c.estado,
      id_unidad: c.id_unidad || ''
    });
  }
  const removeConductor = async (id) => {
    if (!confirm('¿Eliminar conductor?')) return;
    await deleteConductor(id);
    load();
  };

  return (
    <div className="container" style={{ display: 'grid', gap: 24 }}>
      <h2>Unidades & Conductores</h2>

      {/* ========== Crear Unidad ========== */}
      <section style={{ border: '5px solid #abc', borderRadius: 8, padding: 16 }}>
        <h3>Crear Unidad</h3>
        <form onSubmit={submitUnidad} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className='form-group'>
            <label htmlFor="placa">Placa </label>
            <input id='placa' placeholder="Placa "
              value={unidadForm.placa}
              onChange={e => setUnidadForm({ ...unidadForm, placa: e.target.value })} />
          </div>
          <div className='form-group'>
            <label htmlFor="modelo">Modelo</label>
            <input id='modelo' placeholder="Modelo"
              value={unidadForm.modelo}
              onChange={e => setUnidadForm({ ...unidadForm, modelo: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="capacidad">Capacidad</label>
            <input id='capacidad' placeholder="Capacidad *" type="number" min="1"
              value={unidadForm.capacidad}
              onChange={e => setUnidadForm({ ...unidadForm, capacidad: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select value={unidadForm.estado}
              onChange={e => setUnidadForm({ ...unidadForm, estado: e.target.value })}>
              <option value="activo">activo</option>
              <option value="mantenimiento">mantenimiento</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="id_ruta">Ruta</label>
            <select id='id_ruta' value={unidadForm.id_ruta}
              onChange={e => setUnidadForm({ ...unidadForm, id_ruta: e.target.value })}>
              <option value="">-- Ruta * --</option>
              {rutas.map(r => {
                const ocupada = rutasOcupadas.has(r.id_ruta) && !Object.values(rutaNameByUnidadId).includes(r.nombre_ruta);
                return (
                  <option key={r.id_ruta} disabled={ocupada} value={r.id_ruta}>{r.nombre_ruta}{ocupada ? '-- (Asignada)' : ''}</option>)
              }
              )
              }
            </select>
          </div>

          <button type="submit">{editingUnidad ? 'Actualizar' : 'Crear Unidad'}</button>
          {editingUnidad && (
            <button type="button" onClick={() => {
              setEditingUnidad(null);
              setUnidadForm({ placa: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: '' });
            }}>Cancelar</button>
          )}
        </form>

        {/* Lista rápida de Unidades */}
        <div style={{ marginTop: 15 }}>
          <h3>Unidades</h3>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Placa</th><th>Modelo</th><th>Capacidad</th><th>Estado</th><th>Ruta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.id_unidad}>
                  <td>{u.id_unidad}</td>
                  <td>{u.placa}</td>
                  <td>{u.modelo || '-'}</td>
                  <td>{u.capacidad}</td>
                  <td>{u.estado}</td>
                  <td>{u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-'}</td>
                  <td>
                    <button onClick={() => onEditUnidad(u)}>Editar</button>{' '}
                    <button onClick={() => removeUnidad(u.id_unidad)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No hay unidades</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========== Crear Conductor ========== */}
      <section style={{ border: '5px solid #cba', borderRadius: 8, padding: 16 }}>
        <h3>Crear Conductor</h3>
        <form onSubmit={submitConductor} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input id='nombre' placeholder="Nombre "
              value={conductorForm.nombre}
              onChange={e => setConductorForm({ ...conductorForm, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="licencia">Licencia</label>
            <input id='licencia' placeholder="Licencia *"
              value={conductorForm.licencia}
              onChange={e => setConductorForm({ ...conductorForm, licencia: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="correo">Correo</label>
            <input id='correo' placeholder="Correo *" type="email"
              value={conductorForm.correo}
              onChange={e => setConductorForm({ ...conductorForm, correo: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="contraseña">Contraseña</label>
            <input id='contraseña' placeholder="Contraseña *" type="password"
              value={conductorForm.contraseña}
              onChange={e => setConductorForm({ ...conductorForm, contraseña: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input id='telefono' placeholder="Teléfono"
              value={conductorForm.telefono}
              onChange={e => setConductorForm({ ...conductorForm, telefono: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select id='estado' value={conductorForm.estado}
              onChange={e => setConductorForm({ ...conductorForm, estado: e.target.value })}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="id_unidad">Unidad</label>
            <select id='id_unidad' value={conductorForm.id_unidad}
              onChange={e => setConductorForm({ ...conductorForm, id_unidad: e.target.value })}>
              <option value="">-- Unidad * --</option>
              {unidades.map(u => {
                const rutaName = u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-';
                const label = `${u.placa} (${rutaName})`;
                const ocupada = unidadesOcupadas.has(u.id_unidad);
                return (
                  <option key={u.id_unidad} value={u.id_unidad} disabled={ocupada}>
                    {label}{ocupada ? ' — (asignada)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button type="submit">{editingConductor ? 'Actualizar' : 'Crear conductor'}</button>
          {editingConductor && (
            <button type="button" onClick={() => {
              setEditingConductor(null);
              setConductorForm({ nombre: '', licencia: '', correo: '', contraseña: '', telefono: '', estado: 'activo', id_unidad: '' });
            }}>Cancelar</button>
          )}
        </form>


        {/* ========== Listado de Conductores ========== */}
        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3>Conductores</h3>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Licencia</th><th>Teléfono</th><th>Estado</th><th>Unidad</th><th>Ruta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {conductores.map(c => {
                const unidad = unidades.find(u => u.id_unidad === c.id_unidad);
                const ruta = rutas.find(r => r.id_ruta === unidad?.id_ruta);

                return (
                  <tr key={c.id_conductor}>
                    <td>{c.id_conductor}</td>
                    <td>{c.nombre}</td>
                    <td>{c.licencia}</td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.estado}</td>
                    <td>{unidad ? unidad.placa : c.id_unidad || '-'}</td>
                    <td>{ruta ? ruta.nombre_ruta : '-'}</td>
                    <td>
                      <button onClick={() => onEditConductor(c)}>Editar</button>{' '}
                      <button onClick={() => removeConductor(c.id_conductor)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
              {conductores.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>No hay conductores</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </section>
    </div>
  );
}
