import sequelize from '../db.js';
import RoleFactory from './Role.js';
import UsuarioFactory from './Usuario.js';
import RutaFactory from './Ruta.js';
import RutaCoordFactory from './RutaCoord.js';
import ParadaFactory from './Parada.js';


export const Role = RoleFactory(sequelize);
export const Usuario = UsuarioFactory(sequelize);
export const Ruta = RutaFactory(sequelize);
export const RutaCoord = RutaCoordFactory(sequelize);
export const Parada = ParadaFactory(sequelize);

// Roles ↔ Usuarios
Role.hasMany(Usuario, { foreignKey: { name: 'id_rol', allowNull: false }, onDelete: 'RESTRICT' });
Usuario.belongsTo(Role, { foreignKey: { name: 'id_rol', allowNull: false } });

// Ruta ↔ Usuarios (asignación de usuarios a ruta)
Ruta.hasMany(Usuario, { foreignKey: { name: 'id_ruta', allowNull: true }, as: 'usuarios' });
Usuario.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });

// Ruta ↔ rutacoord (asignación de usuarios a ruta)
Ruta.hasMany(RutaCoord, {foreignKey: { name: 'id_ruta', allowNull: true}, as:'coords'});
RutaCoord.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });
// Parada ↔ Usuarios (usuarios con parada asignada)
Parada.hasMany(Usuario, { foreignKey: { name: 'id_parada', allowNull: true } });
Usuario.belongsTo(Parada, { foreignKey: { name: 'id_parada', allowNull: true } });

// Ruta ↔ Parada
Ruta.hasMany(Parada, { foreignKey: { name: 'id_ruta', allowNull: false }, as: 'stops', onDelete: 'CASCADE' });
Parada.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: false } });

// Institucion ↔ Contratos (1–1 por UNIQUE id_institucion)
//Institucion.hasOne(Contratos, { foreignKey: { name: 'id_institucion', unique: true } });
//Contratos.belongsTo(Institucion, { foreignKey: { name: 'id_institucion', unique: true } });


// Ruta ↔ Jornada (PK = fecha)
//Ruta.hasMany(Jornada, { foreignKey: { name: 'id_ruta', allowNull: false } });
//Jornada.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: false } });


// Jornada(fecha) ↔ UsoIntencion.id_jornada (DATE FK)
//Jornada.hasMany(UsoIntencion, { foreignKey: { name: 'id_jornada', allowNull: false }, sourceKey: 'fecha' });
//UsoIntencion.belongsTo(Jornada, { foreignKey: { name: 'id_jornada', allowNull: false }, targetKey: 'fecha' });


// Usuarios ↔ UsoIntencion
//Usuario.hasMany(UsoIntencion, { foreignKey: { name: 'id_usuario', allowNull: false } });
//UsoIntencion.belongsTo(Usuario, { foreignKey: { name: 'id_usuario', allowNull: false } });


// Unidades ↔ UsoIntencion
//Unidades.hasMany(UsoIntencion, { foreignKey: { name: 'id_unidad', allowNull: false } });
//UsoIntencion.belongsTo(Unidades, { foreignKey: { name: 'id_unidad', allowNull: false } });


// Ruta ↔ Reportes
//Ruta.hasMany(Reportes, { foreignKey: { name: 'id_ruta', allowNull: false } });
//Reportes.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: false } });

export const syncDB = async () => {
await sequelize.authenticate();
await sequelize.sync({ alter: true });
};