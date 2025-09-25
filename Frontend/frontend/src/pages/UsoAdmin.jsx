import { useEffect, useMemo, useState } from "react";
import { getUsoIntencion, getUnidades, getJornadas, getParadasByRuta, getRutas } from "../services/api.js";

export function UsoAdmin() {
    const [rows, setRows] = useState([]);
    const [usos, setUsos] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [paradas, setParadas] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const todayISO = new Date().toISOString().slice(0, 10);
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const [f, setF] = useState({
        unidad_id: "",
        jornada_id: "",
        fecha_desde: todayISO,
        fecha_hasta: todayISO,
        search: "",
        solo_confirmados: false,
        agrupar_unidad: false,
    });

    useEffect(() => {
        refetch();
        (async () => {
            try {
                const [uRes, rRes, jRes] = await Promise.all([getUnidades(), getRutas(), getJornadas().catch(() => ({ data: [] }))]);
                setUnidades(uRes?.data?.data || uRes?.data || []);
                setJornadas(jRes?.data?.data || jRes?.data || []);
                setRutas(rRes?.data?.data || rRes?.data || []);
            } catch (e) {
                console.warn("Catálogos parcial:", e.message);
            }
            
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.fecha_desde, f.fecha_hasta, f.unidad_id, f.jornada_id, f.search, f.solo_confirmados]);
    const filtered = useMemo(() => {
        return rows.filter(r => {
            // fechas
            const fecha = new Date(r.fecha);
            const parada = paradas.find(p => p.id_parada === r.parada_id);
            const desde = f.fecha_desde ? new Date(`${f.fecha_desde}T00:00:00`) : null;
            const hasta = f.fecha_hasta ? new Date(`${f.fecha_hasta}T23:59:59`) : null;
            if (desde && fecha < desde) return false;
            if (hasta && fecha > hasta) return false;

            // unidad
            if (f.unidad_id && String(r.unidad_id) !== String(f.unidad_id)) return false;

            // jornada
            //if (f.jornada_id && String(r.jornada) !== String(f.jornada_id)) return false;

            // confirmados
            if (f.solo_confirmados && !r.confirmado) return false;

            // búsqueda
            if (f.search) {
                const term = f.search.toLowerCase();
                const hay = [
                    r.usuario_nombre,
                    r.usuario_correo,
                    r.parada,
                    r.ruta,
                    r.id_jornada,
                ]
                    .filter(Boolean)
                    .some(v => v.toLowerCase().includes(term));
                if (!hay) return false;
            }

            return true;
        });
    }, [rows, f]);
    const rutaNameById = useMemo(() => {
        const map = {};
        rutas.forEach(r => { map[String(r.id_ruta)] = r.nombre_ruta; });
        return map;
    }, [rutas]);
    async function refetch() {
        setLoading(true);
        setErr("");
        try {
            const params = { ...f };
            if (!params.jornada_id) delete params.jornada_id;
            if (!params.search) delete params.search;
            const { data } = await getUsoIntencion(params);
            const list = data?.data || data || [];
            setRows(shapeRows(list));
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    function isConfirmado(r) {
        // Acepta múltiples estilos: booleano, string, numérico
        const v = r.confirmado ?? r.estado ?? r.status ?? r.aprobado;
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return v === 1;
        const s = String(v || "").toLowerCase();
        return ["ok", "true", "1", "confirmado", "confirmada", "aprobado", "aprobada", "si", "sí"].includes(s);
    }

    function shapeRows(list) {
        return list.map((r, i) => ({
            _key: r.id_uso || r.id_usointencion || `uso-${i}`,
            fecha: r.Jornada?.fecha || r.fecha || "",
            unidad_id: r.Jornada?.Unidad?.id_unidad || r.id_unidad || r.unidad_id || "",
            unidad_txt: r.Jornada?.Unidad?.placa || "",
            usuario_nombre: r.Usuario?.nombre || r.usuario_nombre || r.nombre || "",
            usuario_correo: r.Usuario?.correo || r.usuario_correo || r.correo || "",
            parada:
                r.Parada?.nombre_parada ||
                r.Usuario?.Parada?.nombre_parada ||
                r.parada_nombre ||
                r.parada ||
                "—",
            ruta: r.Usuario?.Rutum?.nombre_ruta || r.ruta_nombre || r.ruta || "—",
            //jornada: r.Jornada?.fecha || r.jornada_nombre || r.jornada || "—",
            indicado: r.indicado,
            confirmado: isConfirmado(r),
        }));
    }



    const unidadName = (idOrText) => {
        if (!idOrText) return "";
        if (typeof idOrText === "string" && isNaN(Number(idOrText)) && idOrText.includes("-")) return idOrText;
        const u = unidades.find((x) => String(x.id_unidad) === String(idOrText));
        const r = rutas.find((x) => String(x.id_ruta) === String(u?.id_ruta));
        return   `${u.placa} (${u.Ruta?.nombre_ruta ?? rutaNameById[String(u.id_ruta)] ?? '-'})` || "";
    };

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

    const grouped = useMemo(() => {
        if (!f.agrupar_unidad) return null;
        const m = new Map();
        for (const r of filtered) {
            const key = r.unidad_id || r.unidad_txt || "(sin unidad)";
            if (!m.has(key)) m.set(key, []);
            m.get(key).push(r);
        }
        return m; // Map(unidadKey -> rows[])
    }, [rows, f.agrupar_unidad]);

    return (
        <div className="container">
            <h2>Usuarios que usarán una Unidad</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", margin: "12px 0" }}>
                <div>
                    <label>Unidad</label><br />
                    <select value={f.unidad_id} onChange={(e) => setF({ ...f, unidad_id: e.target.value })}>
                        <option value="">Todas</option>
                        {unidades.map((u) => (
                            <option key={u.id_unidad} value={u.id_unidad}>
                                {u.alias ? `${u.alias} — ${u.placa}` : u.placa}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Desde</label><br />
                    <input
                        type="date"
                        value={f.fecha_desde}
                        onChange={(e) => setF({ ...f, fecha_desde: e.target.value })} />
                </div>
                <div>
                    <label>Hasta</label><br />
                    <input
                        type="date"
                        value={f.fecha_hasta}
                        onChange={(e) => setF({ ...f, fecha_hasta: e.target.value })} />
                </div>
                <div style={{  minWidth: 220 }}>
                    <label>Búsqueda</label><br />
                    <input type="text" placeholder="Nombre o correo del usuario…" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox"  checked={f.agrupar_unidad} onChange={(e) => setF({ ...f, agrupar_unidad: e.target.checked })} />
                    Agrupar por unidad
                </label>

            </div>

            {err && <div style={{ color: "#b91c1c", marginBottom: 8 }}>Error: {err}</div>}

            {/* Vista agrupada */}
            {f.agrupar_unidad && grouped && (
                <div style={{ display: "grid", gap: 16 }}>
                    {[...grouped.entries()].map(([key, items]) => (
                        <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ margin: 0, color: "#b91c1c" }}>{unidadName(key)}</h3>
                                <span className="pill">{items.length} usuarios</span>
                            </div>
                            <table className="table" style={{ width: "100%", marginTop: 8 }}>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>HoraInicio</th>
                                        <th>Usuario</th>
                                        <th>Parada</th>
                                        <th>Estado</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((r) => (
                                        <tr key={r._key}>
                                            <td>{fmtFecha(r.fecha)}</td>
                                            <td>{fmtHora(r.fecha)}</td>
                                            <td>
                                                <div style={{ display: "grid" }}>
                                                    <strong>{r.usuario_nombre}</strong>
                                                    <small style={{ color: "#6b7280" }}>{r.usuario_correo}</small>
                                                </div>
                                            </td>
                                            <td>{r.parada || "—"}</td>
                                            <td>{r.confirmado ? <CheckIcon /> : <XIcon />}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Vista tabla simple */}
            {!f.agrupar_unidad && (
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>HoraInicio</th>
                            <th>Unidad</th>
                            <th>Usuario</th>
                            <th>Ruta</th>
                            <th>Parada</th>
                            <th>Estado</th>

                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r._key}>
                                <td>{fmtFecha(r.fecha)}</td>
                                <td>{fmtHora(r.fecha)}</td>
                                <td>{r.unidad_txt || unidadName(r.unidad_id) || "—"}</td>
                                <td>
                                    <div style={{ display: "grid" }}>
                                        <strong>{r.usuario_nombre}</strong>
                                        <small style={{ color: "#6b7280" }}>{r.usuario_correo}</small>
                                    </div>
                                </td>
                                <td>{r.ruta || "—"}</td>
                                <td>{r.parada || "—"}</td>
                                
                                <td>{r.confirmado ? <CheckIcon /> : <XIcon />}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", opacity: .7, padding: 12 }}>
                                    No hay registros para el filtro seleccionado.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            )}
        </div>
    );
}

function CheckIcon() {
    return (
        <span className="pill ok" title="Confirmado" aria-label="confirmado" role="img" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#2c9c00ff" }}>
            ✓ <small>Confirmado</small>
        </span>
    );
}
function XIcon() {
    return (
        <span className="pill warn" title="Pendiente / No confirmado" aria-label="no confirmado" role="img" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#d14343ff" }}>
            ✗ <small>No confirmado</small>
        </span>
    );
}