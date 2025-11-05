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
    placa: '', matricula: '', matricula_caducidad: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: ''
  });
  const [conductorForm, setConductorForm] = useState({
    nombre: '', licencia: '', licencia_caducidad: '', correo: '', contrasena: '', telefono: '', estado: 'activo', id_unidad: '', id_rolConductor: 'Principal'
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
    if (!unidadForm.placa || !unidadForm.capacidad || !unidadForm.matricula || !unidadForm.matricula_caducidad) {
      alert('Placa, Capacidad , matricula y la fecha de caducidad son obligatorios'); return;
    }
    // Validar que la placa sea única
    const placaExiste = unidades.some(
      (u) => u.placa.toLowerCase() === unidadForm.placa.trim().toLowerCase()
    );
    if (placaExiste && (!editingUnidad || editingUnidad.placa !== unidadForm.placa)) {
      alert("La placa ya está registrada 🚨");
      return;
    }
    const matriculaExiste = unidades.some(
      (u) => u.matricula.toLowerCase() === unidadForm.matricula.trim().toLowerCase()
    );
    if (matriculaExiste && (!editingUnidad || editingUnidad.matricula !== unidadForm.matricula)) {
      alert("La matricula ya está registrada 🚨");
      return;
    }
    const payload = {
      placa: unidadForm.placa.trim(),
      matricula: unidadForm.matricula.trim() || null,
      matricula_caducidad: unidadForm.matricula_caducidad || null,
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
    setUnidadForm({ placa: '', matricula: '', matricula_caducidad: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: '' });
    setEditingUnidad(null);
    load();
  };
  const onEditUnidad = async (u) => {
    setEditingUnidad(u);
    setUnidadForm({
      placa: u.placa,
      matricula: u.matricula || '',
      matricula_caducidad: u.matricula_caducidad ? formatUTCDate(u.matricula_caducidad) : '',
      modelo: u.modelo || '',
      capacidad: u.capacidad,
      estado: u.estado,
      id_ruta: u.id_ruta || ''
    });
  }
  function formatUTCDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const conductoresPorUnidad = useMemo(() => {
    const map = {};
    conductores.forEach(c => {
      if (!map[c.id_unidad]) map[c.id_unidad] = [];
      map[c.id_unidad].push(c);
    });
    return map;
  }, [conductores]);

  function isMatriculaCaducada(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignoramos la hora
    const fechaCaducidad = new Date(dateStr);
    fechaCaducidad.setHours(0, 0, 0, 0);
    return fechaCaducidad < today;
  }
  function isLicenciaCaducida(dataStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignoramos la hora
    const fechaCaducidad = new Date(dataStr);
    fechaCaducidad.setHours(0, 0, 0, 0);
    return fechaCaducidad < today;
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
    if (!conductorForm.nombre || !conductorForm.licencia || !conductorForm.id_unidad || !conductorForm.correo || !conductorForm.contrasena) {
      alert('Nombre, Licencia, Unidad, correo y contraseña son obligatorios'); return;
    }
    // 🚨 Validar que solo haya un principal por unidad
    const listaConductores = conductoresPorUnidad[conductorForm.id_unidad] || [];
    if (conductorForm.id_rolConductor === 'Principal') {
      const yaPrincipal = listaConductores.some(c => c.id_rolConductor === 1 && (!editingConductor || c.id_conductor !== editingConductor.id_conductor));

      if (yaPrincipal) {
        alert("Esta unidad ya tiene un conductor principal 🚨");
        return;
      }

    }
    if (conductorForm.id_rolConductor === 'Suplente') {
      const yaSuplente = listaConductores.some(c => c.id_rolConductor === 2 && (!editingConductor || c.id_conductor !== editingConductor.id_conductor));
      if (yaSuplente) {
        alert("Esta unidad  ya tiene un conductor suplente 🚨")
        return;
      }
    }
    if (!editingConductor && listaConductores.length >= 2) {
      alert("Esta unidad ya tiene 2 conductores asignados 🚨");
      return;
    }
    const payload = {
      nombre: conductorForm.nombre.trim(),
      licencia: conductorForm.licencia.trim(),
      licencia_caducidad: conductorForm.licencia_caducidad.trim(),
      correo: conductorForm.correo.trim(),
      contrasena: conductorForm.contrasena.trim(),
      telefono: conductorForm.telefono?.trim() || null,
      estado: conductorForm.estado,
      id_unidad: Number(conductorForm.id_unidad),
      id_rolConductor: conductorForm.id_rolConductor === 'Principal' ? 1 : 2, // 1=Principal, 2=Suplente
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

    setConductorForm({ nombre: '', licencia: '', licencia_caducidad: '', correo: '', contrasena: '', telefono: '', estado: 'activo', id_unidad: '' });
    setEditingConductor(null);
    load();
  };

  const onEditConductor = async (c) => {
    setEditingConductor(c);
    setConductorForm({
      nombre: c.nombre,
      licencia: c.licencia,
      licencia_caducidad: c.licencia_caducidad ? formatUTCDate(c.licencia_caducidad) : '',
      correo: c.correo,
      contrasena: '',
      telefono: c.telefono || '',
      estado: c.estado,
      id_unidad: c.id_unidad || '',
      id_rolConductor: c.id_rolConductor === 1 ? 'Principal' : 'Suplente'
    });
  }
  const removeConductor = async (id) => {
    if (!confirm('¿Eliminar conductor?')) return;
    await deleteConductor(id);
    load();
  };
  const conductoresOrdenados = useMemo(() => {
    return [...conductores].sort((a, b) => {
      const unidadA = unidades.find(u => u.id_unidad === a.id_unidad);
      const unidadB = unidades.find(u => u.id_unidad === b.id_unidad);
      const rutaA = rutas.find(r => r.id_ruta === unidadA?.id_ruta);
      const rutaB = rutas.find(r => r.id_ruta === unidadB?.id_ruta);

      const nombreRutaA = rutaA?.nombre_ruta || '';
      const nombreRutaB = rutaB?.nombre_ruta || '';

      return nombreRutaA.localeCompare(nombreRutaB, 'es', { sensitivity: 'base' });
    });
  }, [conductores, unidades, rutas]);

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
            <label htmlFor="matricula">Matrícula</label>
            <input id='matricula' placeholder="Matrícula"
              value={unidadForm.matricula}
              onChange={e => setUnidadForm({ ...unidadForm, matricula: e.target.value })} />
          </div>
          <div className='form-group'>
            <label htmlFor="matricula_caducidad">Fecha de Caducidad</label>
            <input id='matricula_caducidad' type="date"
              value={unidadForm.matricula_caducidad}
              onChange={e => setUnidadForm({ ...unidadForm, matricula_caducidad: e.target.value })} />
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
              setUnidadForm({ placa: '', matricula: '', matricula_caducidad: '', modelo: '', capacidad: '', estado: 'activo', id_ruta: '' });
            }}>Cancelar</button>
          )}
        </form>

        {/* Lista rápida de Unidades */}
        <div style={{ marginTop: 15 }}>
          <h3>Unidades</h3>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Placa</th><th>Matricula</th><th>FechaCaducidad</th><th>Modelo</th><th>Capacidad</th><th>Estado</th><th>Ruta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.id_unidad}>
                  <td>{u.id_unidad}</td>
                  <td>{u.placa}</td>
                  <td>{u.matricula || '-'}</td>
                  <td>
                    {u.matricula_caducidad ? formatUTCDate(u.matricula_caducidad) : '-'}
                    {u.matricula_caducidad && isMatriculaCaducada(u.matricula_caducidad) && (
                      <span style={{ color: 'red', marginLeft: '8px', fontWeight: 'bold' }}>
                        Matricula caducada
                      </span>
                    )}
                  </td>
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
          <div className='form-group'>
            <label htmlFor='licencia_caducidad'>Fecha de Caducidad</label>
            <input id='licencia_caducidad' type='date'
              value={conductorForm.licencia_caducidad}
              onChange={e => setConductorForm({ ...conductorForm, licencia_caducidad: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="correo">Correo</label>
            <input id='correo' placeholder="Correo *" type="email"
              value={conductorForm.correo}
              onChange={e => setConductorForm({ ...conductorForm, correo: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input id='contrasena' placeholder="Contraseña *" type="password"
              value={conductorForm.contrasena}
              onChange={e => setConductorForm({ ...conductorForm, contrasena: e.target.value })} />
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
            <label htmlFor="id_rolConductor">Rol</label>
            <select id="id_rolConductor" value={conductorForm.id_rolConductor}
              onChange={e => setConductorForm({ ...conductorForm, id_rolConductor: e.target.value })}>
              <option value="Principal">Principal</option>
              <option value="Suplente">Suplente</option>
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
                const listaConductores = conductoresPorUnidad[u.id_unidad] || [];
                const ocupada = listaConductores.length >= 2; // máximo 2

                return (
                  <option key={u.id_unidad} value={u.id_unidad} disabled={ocupada}>
                    {label}{ocupada ? ' — (2 conductores asignados)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button type="submit">{editingConductor ? 'Actualizar' : 'Crear conductor'}</button>
          {editingConductor && (
            <button type="button" onClick={() => {
              setEditingConductor(null);
              setConductorForm({ nombre: '', licencia: '', licencia_caducidad: '', correo: '', contrasena: '', telefono: '', estado: 'activo', id_unidad: '', id_rolConductor: '' });
            }}>Cancelar</button>
          )}
        </form>


        {/* ========== Listado de Conductores ========== */}
        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3>Conductores</h3>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Licencia</th><th>FechaCaducidad</th><th>Teléfono</th><th>Estado</th><th>Rol</th><th>Unidad</th><th>Ruta</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {conductoresOrdenados.map(c => {
                const unidad = unidades.find(u => u.id_unidad === c.id_unidad);
                const ruta = rutas.find(r => r.id_ruta === unidad?.id_ruta);

                return (
                  <tr key={c.id_conductor}>
                    <td>{c.id_conductor}</td>
                    <td>
                      <div style={{ display: "grid" }}>
                        <stron>{c.nombre}</stron>
                        <small style={{ color: "#1b2e54ff" }}> {c.correo}</small>
                      </div>
                    </td>
                    <td>{c.licencia}</td>
                    <td>
                      {c.licencia_caducidad ? formatUTCDate(c.licencia_caducidad) : '-'}
                      {c.licencia_caducidad && isLicenciaCaducida(c.licencia_caducidad) && (
                        <span style={{ color: 'red', marginLeft: '8px', fontWeight: 'bold' }}>
                          Licencia caducida
                        </span>
                      )}
                    </td>
                    <td>{c.telefono || '-'}</td>
                    <td>{c.estado}</td>
                    <td>{c.id_rolConductor === 1 ? 'Principal' : 'Suplente'}</td>
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