import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

function DrawTools({ onCapture }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);
  const onCaptureRef = useRef(onCapture);
  useEffect(() => { onCaptureRef.current = onCapture; }, [onCapture]);

  useEffect(() => {
    // Grupo de capas dibujadas
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Control de dibujo
    const drawControl = new L.Control.Draw({
      draw: { polygon: false, circle: false, rectangle: false, marker: true, polyline: true },
      edit: { featureGroup: drawnItems }
    });
    map.addControl(drawControl);

    // Handler estable (una sola suscripción)
    const onCreated = (e) => {
      const { layerType, layer } = e;

      if (layerType === "marker") {
        const count = drawnItems.getLayers().filter(l => l instanceof L.Marker).length;
        const nombre = prompt("Nombre de la parada:", `Parada ${count + 1}`) || `Parada ${count + 1}`;
        layer.options.title = nombre;
        layer.bindTooltip(nombre, { direction: "top" });
      }

      drawnItems.addLayer(layer);
      map.dragging.enable(); // por si la herramienta lo dejó deshabilitado
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.DRAWSTOP, () => map.dragging.enable());
    map.on(L.Draw.Event.EDITSTOP, () => map.dragging.enable());
    map.on(L.Draw.Event.DELETESTOP, () => map.dragging.enable());

    // Botón de capturar
    const handleCapture = () => {
      const data = { coords: [], stops: [] };
      drawnItems.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const latlngs = layer.getLatLngs();
          const flat = Array.isArray(latlngs[0]) ? latlngs.flat() : latlngs;
          flat.forEach((p, i) => data.coords.push({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6), orden: i + 1 }));
        }
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng();
          const nombre = layer.options?.title || `Parada ${data.stops.length + 1}`;
          data.stops.push({ nombre_parada: nombre, lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
        }
      });
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

    // Limpieza: elimina listeners y controles (evita duplicados)
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.DRAWSTOP);
      map.off(L.Draw.Event.EDITSTOP);
      map.off(L.Draw.Event.DELETESTOP);
      map.removeControl(drawControl);
      map.removeControl(captureBtn);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
}

export default function MapEditor({ onCapture }) {
  return (
    <MapContainer
      center={[-0.18, -78.49]}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
      scrollWheelZoom={true}
      dragging={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <DrawTools onCapture={onCapture} />
    </MapContainer>
  );
}
