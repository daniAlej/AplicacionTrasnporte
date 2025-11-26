
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/plasticine/100/000000/bus.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const stopIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/fluency/48/marker.png',
  iconSize: [35, 35],
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
});

export const LocationMap = ({ driver, route }) => {
  const driverPosition = driver ? [driver.latitud_actual, driver.longitud_actual] : null;
  const routeCoords = route && route.coords ? route.coords.map(c => [c.lat, c.lng]) : [];
  const stops = route && route.stops ? route.stops : [];

  return (
    <MapContainer center={driverPosition || [-0.18, -78.49]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {driverPosition && (
        <Marker position={driverPosition} icon={busIcon}>
          <Popup>
            <strong>{driver.nombre}</strong>
          </Popup>
        </Marker>
      )}
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="blue" />
      )}
      {stops.length > 0 && stops.map((stop, index) => (
        <Marker
          key={stop.id_parada || index}
          position={[parseFloat(stop.lat), parseFloat(stop.lng)]}
          icon={stopIcon}
        >
          <Popup>
            <strong>{stop.nombre_parada}</strong>
            {stop.orden && <div><small>Orden: {stop.orden}</small></div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
