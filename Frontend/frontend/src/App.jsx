import { Routes, Route, NavLink } from 'react-router-dom';
import UsersPage from './pages/UsersPage.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import ConductorPage from './pages/ConductorPage.jsx';

export default function App() {
  return (
    <div className="app">
      <nav className="topnav">
        <NavLink to="/usuarios">Usuarios</NavLink>
        <NavLink to="/rutas">Rutas</NavLink>
        <NavLink to="/conductoresUnidades">Conductores-Unidades</NavLink>
      </nav>
      <Routes>
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/rutas" element={<RoutesPage />} />
        <Route path="/conductoresUnidades" element={<ConductorPage/>} />
        <Route path="*" element={<UsersPage />} />
      </Routes>
    </div>
  );
}