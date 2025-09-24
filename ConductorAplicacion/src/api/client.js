import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.7.27:8000', // cambia por tu backend
  timeout: 10000,
});

export default api;
