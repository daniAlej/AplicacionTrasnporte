import { useEffect, useMemo, useState } from "react";
import { getReportes, getUnidades, getRutas, getUsuarios, getConductores } from "../services/api.js";

export default function ReportesAdminPage() {
  const [reportes, setReportes] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [err, setErr] = useState("");

  const todayISO = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [f, setF] = useState({
    unidad_id: "",
    fecha_desde: firstOfMonth,
    fecha_hasta: todayISO,
    search: "",
  });

  // cargar data inicial
  useEffect(() => {
    (async () => {
      try {
        const [r, u, ru, us, c] = await Promise.all([
          getReportes(),
          getUnidades(),
          getRutas(),
          getUsuarios(),
          getConductores(),
        ]);
        setReportes(r.data || []);
        setUnidades(u.data || []);
        setRutas(ru.data || []);
        setUsuarios(us.data || []);
        setConductores(c.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  // filtro en frontend
  const filtered = useMemo(() => {
    return reportes.filter((r) => {
      const jefeRecorrido = usuarios.find(u => u.id_usuario === r?.id_usuario);
      const conductor = conductores.find(c => c.id_conductor === r?.id_conductor);
      // fecha en rango
      const fecha = new Date(r.fecha);
      const desde = f.fecha_desde ? new Date(`${f.fecha_desde}T00:00:00`) : null;
      const hasta = f.fecha_hasta ? new Date(`${f.fecha_hasta}T23:59:59`) : null;
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      // unidad
      if (f.unidad_id && String(r.Rutum?.Unidads?.[0]?.id_unidad) !== String(f.unidad_id)) return false;

      // búsqueda
      if (f.search) {
        const term = f.search.toLowerCase();
        const hay = [
          r.tipo,
          r.descripcion,
          r.Rutum?.nombre_ruta,
          r.Rutum?.Unidads?.[0]?.placa,
          jefeRecorrido?.nombre,
          conductor?.nombre,
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term));
        if (!hay) return false;
      }

      return true;
    });
  }, [reportes, f]);

  // Fecha sin desfase (solo YYYY-MM-DD)
  function fmtFecha(v) {
    if (!v) return "—";
    const s = String(v);
    if (s.includes("T")) return s.slice(0, 10); // yyyy-mm-dd
    return s;
  }
  function fmtHora(v) {
    if (!v) return "—";
    const s = String(v);
    if (s.includes("T")) return s.slice(11, 16); // HH:MM
    return s;
  }
  function fmtLatitud(v) {
    if (!v) return "—";
    return Number(v).toFixed(6);
  }
  function fmtLongitud(v) {
    if (!v) return "—";
    return Number(v).toFixed(6);
  }
  function fmtLatitudLongitud(v) {
    if (!v) return "—";
    return `${Number(v.latitud).toFixed(6)}, ${Number(v.longitud).toFixed(6)}`;
  }
  return (
    <div className="container">
      <h2>Reportes de Unidades</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", margin: "12px 0" }}>
        <div>
          <label>Unidad</label><br />
          <select
            value={f.unidad_id}
            onChange={(e) => setF({ ...f, unidad_id: e.target.value })}
          >
            <option value="">Todas</option>
            {unidades.map((u) => (
              <option key={u.id_unidad} value={u.id_unidad}>
                {u.placa}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Desde</label><br />
          <input
            type="date"
            value={f.fecha_desde}
            onChange={(e) => setF({ ...f, fecha_desde: e.target.value })}
          />
        </div>
        <div>
          <label>Hasta</label><br />
          <input
            type="date"
            value={f.fecha_hasta}
            onChange={(e) => setF({ ...f, fecha_hasta: e.target.value })}
          />
        </div>
        <div style={{ minWidth: 220 }}>
          <label>Búsqueda</label><br />
          <input
            type="text"
            placeholder="Tipo, detalle, usuario…"
            value={f.search}
            onChange={(e) => setF({ ...f, search: e.target.value })}
          />
        </div>
      </div>

      {err && <div style={{ color: "#b91c1c", marginBottom: 8 }}>Error: {err}</div>}

      <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Ruta</th>
            <th>Unidad</th>
            <th>Tipo</th>
            <th>Detalle</th>
            <th>Reportado por</th>
            <th>Lugar</th>
            <th>Foto</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const jefeRecorrido = usuarios.find(u => u.id_usuario === r?.id_usuario);
            const conductor = conductores.find(c => c.id_conductor === r?.id_conductor);
            const reportado = jefeRecorrido?.nombre
              ? `${jefeRecorrido?.nombre} (Jefe)`
              : conductor?.nombre
                ? `${conductor?.nombre} (Conductor)`
                : "-";

            return (
              <tr key={r.id_reporte}>
                <td>{fmtFecha(r.fecha)}</td>
                <td>{fmtHora(r.fecha)}</td>
                <td>{r.Rutum?.nombre_ruta || "-"}</td>
                <td>{r.Rutum?.Unidads?.[0]?.placa || "-"}</td>
                <td><span className="pill info">{r.tipo}</span></td>
                <td
                  title={r.descripcion}
                  style={{ maxWidth: 480, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {r.descripcion}
                </td>
                <td>{reportado}</td>
                <td>
                  {r.latitud && r.longitud ? (
                    <a
                      href={`https://www.google.com/maps?q=${r.latitud},${r.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                      title={`${fmtLatitud(r.latitud)}, ${fmtLongitud(r.longitud)}`}
                    >
                      Ver en mapa
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {r.foto_url ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {/* Vista previa */}
                      <img
                        src={r.foto_url}
                        alt="foto reporte"
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                      {/* Botón descargar */}
                      <a
                        href={r.foto_url}
                        download={`reporte_${r.id_reporte}.jpg`}
                        style={{ textAlign: "center", color: "#2563eb", textDecoration: "underline", fontSize: 13 }}
                      >
                        Descargar
                      </a>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>

              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", opacity: .7, padding: 12 }}>
                No hay reportes para el filtro seleccionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
