import bcrypt from 'bcrypt';
import { Usuario } from '../models/index.js';
import { sign } from '../utils/jwt.js';
import sequelize from '../db.js';

export async function loginUsuario(req, res) {
  try {
    const { correo, contrasena } = req.body;

    const usuario = await Usuario.findOne({
      where: { correo, estado: 'activo' }
    });

    if (!usuario) return res.status(400).json({ error: 'No hay usuario con ese correo' });

    // NOTA: Las contraseñas no están hasheadas en la base de datos.
    // Se realiza una comparación directa, pero esto es inseguro.
    // TODO: Implementar bcrypt en el registro de usuarios y cambiar esto.
    const ok = contrasena === usuario.contrasena;
    // const ok = await bcrypt.compare(contrasena, usuario.contrasena).catch(() => false);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });
    if (Number(usuario.id_rol) !== 2) {
      return res.status(403).json({ error: 'No es un conductor válido' });
    }
  
    const token = sign({
      role: 'usuario',
      id_usuario: usuario.id_usuario,
      id_ruta: usuario.id_ruta,
      id_parada: usuario.id_parada,
      id_rol: usuario.id_rol
    });

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        id_ruta: usuario.id_ruta,
        id_parada: usuario.id_parada,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en login' });
  }
}
