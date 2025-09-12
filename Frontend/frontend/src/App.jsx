import { Routes, Route, NavLink } from 'react-router-dom';
import UsersPage from './pages/UsersPage.jsx';
import RoutesPage from './pages/RoutesPage.jsx';


export default function App() {
  return (
    <div className="app">
      <nav className="topnav">
        <NavLink to="/usuarios">Usuarios</NavLink>
        <NavLink to="/rutas">Rutas</NavLink>
      </nav>
      <Routes>
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/rutas" element={<RoutesPage />} />
        <Route path="*" element={<UsersPage />} />
      </Routes>
    </div>
  );
}