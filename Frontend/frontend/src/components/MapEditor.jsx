// MapEditor.jsx
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// ---- Utilidades: hashing simple para evitar comparaciones profundas pesadas
const stableKey = (arr) => {
  try { return JSON.stringify(arr ?? []); } catch { return "[]"; }
};

function DrawTools({ onCapture, initialCoords = [], initialStops = [], fitOnInit = true }) {
  const map = useMap();

  // Refs para objetos Leaflet (no React state => no bucles)
  const drawnItemsRef = useRef(null);
  const drawControlRef = useRef(null);
  const captureBtnRef = useRef(null);
  const onCaptureRef = useRef(onCapture);
  const isDrawingRef = useRef(false);

  // Mantener la referencia más reciente de onCapture
  useEffect(() => { onCaptureRef.current = onCapture; }, [onCapture]);

  // 1) Montaje: crear FeatureGroup, controles y listeners SOLO UNA VEZ
  useEffect(() => {
    // Sobrescribir textos de Leaflet Draw
L.drawLocal.draw.toolbar.actions = {
  title: 'Cancelar dibujo',
  text: 'Cancelar'
};
L.drawLocal.draw.toolbar.finish = {
  title: 'Guardar dibujo',
  text: 'Guardar ruta'
};
L.drawLocal.draw.toolbar.undo = {
  title: 'Eliminar último punto',
  text: 'Deshacer'
};

L.drawLocal.edit.toolbar.actions = {
  save: {
    title: 'Guardar cambios',
    text: 'Guardar'
  },
  cancel: {
    title: 'Cancelar edición',
    text: 'Cancelar'
  },
  clearAll: {
    title: 'Eliminar todo',
    text: 'Borrar todo'
  }
};

    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: { polygon: false, circle: false, rectangle: false, marker: true, polyline: true },
      edit: { featureGroup: drawnItems }
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Handlers estables
    const onCreated = (e) => {
      const { layerType, layer } = e;

      if (layerType === "marker") {
        const count = drawnItems.getLayers().filter(l => l instanceof L.Marker).length;
        const nombre = prompt("Nombre de la parada:", `Parada ${count + 1}`) || `Parada ${count + 1}`;
        layer.options.title = nombre;
        layer.bindTooltip(nombre, { direction: "top" });
      }

      drawnItems.addLayer(layer);
      // Habilita drag si alguna herramienta lo desactivó
      map.dragging.enable();
    };
    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.DRAWSTART, () => { isDrawingRef.current = true; });
    map.on(L.Draw.Event.EDITSTART, () => { isDrawingRef.current = true; });
    map.on(L.Draw.Event.DRAWSTOP, () => { map.dragging.enable(), isDrawingRef.current = false; });
    map.on(L.Draw.Event.EDITSTOP, () => { map.dragging.enable(), isDrawingRef.current = false; });
    map.on(L.Draw.Event.DELETESTOP, () => { map.dragging.enable(), isDrawingRef.current = false; });

    // Botón de “Capturar Ruta”
    const handleCapture = () => {
      if (isDrawingRef.current) {
        alert("Debes finalizar la edición o creación con el botón 'Save/Finish' antes de capturar la ruta.");
        return;
      }
      const data = { coords: [], stops: [] };
      drawnItems.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const latlngs = layer.getLatLngs();
          const flat = Array.isArray(latlngs[0]) ? latlngs.flat() : latlngs;
          flat.forEach((p, i) => data.coords.push({
            lat: +p.lat.toFixed(6),
            lng: +p.lng.toFixed(6),
            orden: i + 1
          }));
        }
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng();
          const nombre = layer.options?.title || `Parada ${data.stops.length + 1}`;
          data.stops.push({ nombre_parada: nombre, lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
        }
      });
      // IMPORTANTE: esto llama setState en el padre, pero solo al pulsar el botón
      onCaptureRef.current?.(data);
    };

    const captureBtn = L.control({ position: "topleft" });
    captureBtn.onAdd = () => {
      const button = L.DomUtil.create("button", "btn-capture");
      button.innerHTML = "📍 Capturar Ruta";
      button.style.background = "white";
      button.style.padding = "6px 10px";
      button.style.border = "1px solid #ddd";
      button.style.borderRadius = "8px";
      button.style.cursor = "pointer";
      button.onclick = handleCapture;
      return button;
    };
    captureBtn.addTo(map);
    captureBtnRef.current = captureBtn;

    // Limpieza (desmontaje)
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.DRAWSTOP);
      map.off(L.Draw.Event.EDITSTOP);
      map.off(L.Draw.Event.DELETESTOP);

      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
      if (captureBtnRef.current) {
        map.removeControl(captureBtnRef.current);
        captureBtnRef.current = null;
      }

      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
        drawnItemsRef.current = null;
      }
    };
  }, [map]);

  // 2) Precarga/Redibujo desde props (no usa setState, solo capas Leaflet)
  const coordsKey = useMemo(() => stableKey(initialCoords), [initialCoords]);
  const stopsKey = useMemo(() => stableKey(initialStops), [initialStops]);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    // Limpiar capas actuales antes de dibujar desde props
    drawnItems.clearLayers();

    // Dibujar polyline (si viene)
    if (initialCoords && initialCoords.length) {
      const latlngs = initialCoords
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        .map(p => [Number(p.lat), Number(p.lng)]);
      const line = L.polyline(latlngs);
      drawnItems.addLayer(line);
    }

    // Dibujar paradas (si vienen)
    if (initialStops && initialStops.length) {
      initialStops.forEach((s, i) => {
        const marker = L.marker([Number(s.lat), Number(s.lng)], { title: s.nombre_parada || s.nombre || `Parada ${i + 1}` });
        marker.bindTooltip(marker.options.title, { direction: "top" });
        drawnItems.addLayer(marker);
      });
    }

    // Ajustar vista
    if (fitOnInit) {
      const pts = [];
      drawnItems.eachLayer(l => {
        if (l.getLatLng) {
          const p = l.getLatLng();
          pts.push([p.lat, p.lng]);
        } else if (l.getLatLngs) {
          const arr = l.getLatLngs();
          const flat = Array.isArray(arr[0]) ? arr.flat() : arr;
          flat.forEach(p => pts.push([p.lat, p.lng]));
        }
      });
      if (pts.length) {
        const bounds = L.latLngBounds(pts);
        map.fitBounds(bounds.pad(0.15));
      }
    }
    // Importante: dependemos de los "keys" estables, no de los arrays crudos
  }, [coordsKey, stopsKey, fitOnInit, map]);

  return null;
}

export default function MapEditor({
  onCapture,
  initialCoords = [],
  initialStops = [],
  height = 500,
  center = [-0.18, -78.49],
  zoom = 13,
  fitOnInit = true,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: `${height}px`, width: "100%" }}
      scrollWheelZoom={true}
      dragging={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <DrawTools
        onCapture={onCapture}
        initialCoords={initialCoords}
        initialStops={initialStops}
        fitOnInit={fitOnInit}
      />
    </MapContainer>
  );
}
