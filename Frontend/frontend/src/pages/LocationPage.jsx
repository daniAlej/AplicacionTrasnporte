import React, { useState, useEffect } from 'react';
import { getActiveConductorLocations, getRuta } from '../services/api';
import { LocationMap } from '../components/LocationMap';

export const LocationPage = () => {
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveDrivers = async () => {
    try {
      const response = await getActiveConductorLocations();
      setActiveDrivers(response.data);
    } catch (error) {
      console.error("Error fetching active drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDrivers();
  }, []);

  useEffect(() => {
    let intervalId;
    if (selectedDriver) {
      intervalId = setInterval(async () => {
        try {
          const response = await getActiveConductorLocations();
          setActiveDrivers(response.data);
          const updatedDriver = response.data.find(d => d.id_conductor === selectedDriver.id_conductor);
          if (updatedDriver) {
            setSelectedDriver(updatedDriver);
          }

        } catch (error) {
          console.error("Error refreshing driver location:", error);
          setActiveDrivers([]);
          setSelectedDriver(null);
          setRoute(null);
        }
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedDriver]);


  const handleDriverClick = async (driver) => {
    setSelectedDriver(driver);
    if (driver.Unidad?.id_ruta) {
      try {
        const response = await getRuta(driver.Unidad.id_ruta);
        setRoute(response.data);
      } catch (error) {
        console.error("Error fetching route:", error);
        setRoute(null);
      }
    } else {
      setRoute(null);
    }
  };

  return (
    <div>
      <h1>Ubicación en Tiempo Real de los Conductores</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '30%', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
          <h2>Unidades Activas</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : activeDrivers.length > 0 ? (
            <ul>
              {activeDrivers.map((driver) => (
                <li key={driver.id_conductor} onClick={() => handleDriverClick(driver)} style={{ cursor: 'pointer', padding: '5px', backgroundColor: selectedDriver?.id_conductor === driver.id_conductor ? '#eee' : 'transparent' }}>
                  {driver.nombre} - Unidad: {driver.Unidad?.placa || 'No asignada'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay conductores activos en este momento.</p>
          )}
        </div>
        <div style={{ width: '70%', paddingLeft: '10px' }}>
          {selectedDriver ? (
            <div>
              <h3>Ubicación de {selectedDriver.nombre}</h3>
              <LocationMap driver={selectedDriver} route={route} />
            </div>
          ) : (
            <p>Seleccione un conductor para ver su ubicación.</p>
          )}
        </div>
      </div>
    </div>
  );
};