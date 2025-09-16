import axios from 'axios';


export const API = axios.create({ baseURL: 'http://localhost:8000/api' });


// Roles
export const getRoles = () => API.get('/roles');


// Usuarios (usa campos: nombre, correo, contrasena, id_rol, id_ruta?, id_parada?)
export const getUsuarios = () => API.get('/usuarios');
export const createUsuario = (data) => API.post('/usuarios', data);
export const updateUsuario = (id, data) => API.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => API.delete(`/usuarios/${id}`);


// Rutas (usa nombre_ruta, coords[{lat,lng,orden}], stops[{nombre_parada,lat,lng}], id_usuario?)
export const getRutas = () => API.get('/rutas');
export const getRuta = (id) => API.get(`/rutas/${id}`);
export const getParadasByRuta = (id) => API.get(`/rutas/${id}/paradas`);
export const createRuta = (data) => API.post('/rutas', data);
export const updateRuta = (id, data) => API.put(`/rutas/${id}`, data);
export const deleteRuta = (id) => API.delete(`/rutas/${id}`);

// Conductores (usa nombre, correo, telefono, licencia, id_unidad?)
export const getConductores = () => API.get('/conductores');
export const createConductor = (data) => API.post('/conductores', data);
export const updateConductor = (id, data) => API.put(`/conductores/${id}`, data);
export const deleteConductor = (id) => API.delete(`/conductores/${id}`);
// Unidades (usa placa, modelo, capacidad)
export const getUnidades = () => API.get('/unidades');
export const createUnidad = (data) => API.post('/unidades', data);
export const updateUnidad = (id, data) => API.put(`/unidades/${id}`, data);
export const deleteUnidad = (id) => API.delete(`/unidades/${id}`);
