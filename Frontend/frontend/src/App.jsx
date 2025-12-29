import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import UsersPage from './pages/UsersPage.jsx';
import MiviajePage from './pages/MiviajePage.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import ConductorPage from './pages/ConductorPage.jsx';
import ReportesAdminPage from './pages/ReportesAdminPage.jsx';
import { UsoAdmin } from './pages/UsoAdmin.jsx';
import { LocationPage } from './pages/LocationPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
  const location = useLocation();

  // No mostrar el navbar en la landing page ni en el login
  const showNav = location.pathname !== '/' && location.pathname !== '/login';

  return (
    <div className="app">
      {showNav && (
        <nav className="topnav">
          <NavLink to="/usuarios">Usuarios</NavLink>
          <NavLink to="/rutas">Rutas</NavLink>
          <NavLink to="/conductoresUnidades">Conductores-Unidades</NavLink>
          <NavLink to="/reportes">Reportes</NavLink>
          <NavLink to="/UsoDeUnidades">Uso de Unidades</NavLink>
          <NavLink to="/ubicacion">Ubicación</NavLink>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/rutas" element={<RoutesPage />} />
        <Route path="/conductoresUnidades" element={<ConductorPage />} />
        <Route path="/reportes" element={<ReportesAdminPage />} />
        <Route path="/UsoDeUnidades" element={<UsoAdmin />} />
        <Route path="/ubicacion" element={<LocationPage />} />
      </Routes>
    </div>
  );
}