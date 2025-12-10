import sequelize from '../db.js';
import RoleFactory from './Role.js';
import UsuarioFactory from './Usuario.js';
import RutaFactory from './Ruta.js';
import RutaCoordFactory from './RutaCoord.js';
import ParadaFactory from './Parada.js';
import ConductorFactory from './Conductor.js';
import UnidadFactory from './Unidad.js';
import AdminFactory from './Administrador.js';
import InstitucionFactory from './Institucion.js';
import ContratosFactory from './Contratos.js';
import JornadaFactory from './Jornada.js';
import UsoIntencionFactory from './UsoIntencion.js';
import ReportesFactory from './Reportes.js';
import RolConductorFactory from './RolConductor.js';
import ParadaVisitaFactory from './ParadaVisita.js';



export const Role = RoleFactory(sequelize);
export const Usuario = UsuarioFactory(sequelize);
export const Ruta = RutaFactory(sequelize);
export const RutaCoord = RutaCoordFactory(sequelize);
export const Parada = ParadaFactory(sequelize);
export const Conductor = ConductorFactory(sequelize);
export const Unidad = UnidadFactory(sequelize);
export const Institucion = InstitucionFactory(sequelize);
export const Contratos = ContratosFactory(sequelize);
export const Admin = AdminFactory(sequelize);
export const Jornada = JornadaFactory(sequelize);
export const UsoIntencion = UsoIntencionFactory(sequelize);
export const Reportes = ReportesFactory(sequelize);
export const RolConductor = RolConductorFactory(sequelize);
export const ParadaVisita = ParadaVisitaFactory(sequelize);

//administrador ↔ Institucion (1–1 por UNIQUE id_institucion)
Institucion.hasOne(Admin, { foreignKey: { name: 'id_institucion', unique: true } });
Admin.belongsTo(Institucion, { foreignKey: { name: 'id_institucion', unique: true } });

// Roles ↔ Usuarios
Role.hasMany(Usuario, { foreignKey: { name: 'id_rol', allowNull: false }, onDelete: 'RESTRICT' });
Usuario.belongsTo(Role, { foreignKey: { name: 'id_rol', allowNull: false } });

// RolesConductor ↔ Conductores
RolConductor.hasMany(Conductor, { foreignKey: { name: 'id_rolConductor', allowNull: false }, onDelete: 'RESTRICT' });
Conductor.belongsTo(RolConductor, { foreignKey: { name: 'id_rolConductor', allowNull: false } });

//Roles ↔ Conductores
Role.hasMany(Conductor, { foreignKey: { name: 'id_rol', allowNull: false }, onDelete: 'RESTRICT' });
Conductor.belongsTo(Role, { foreignKey: { name: 'id_rol', allowNull: false } });

// Ruta ↔ Usuarios (asignación de usuarios a ruta)
Ruta.hasMany(Usuario, { foreignKey: { name: 'id_ruta', allowNull: true }, as: 'usuarios' });
Usuario.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });

// Ruta ↔ rutacoord (asignación de usuarios a ruta)
Ruta.hasMany(RutaCoord, { foreignKey: { name: 'id_ruta', allowNull: true }, as: 'coords' });
RutaCoord.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });
// Parada ↔ Usuarios (usuarios con parada asignada)
Parada.hasMany(Usuario, { foreignKey: { name: 'id_parada', allowNull: true } });
Usuario.belongsTo(Parada, { foreignKey: { name: 'id_parada', allowNull: true } });

// Ruta ↔ Parada
Ruta.hasMany(Parada, { foreignKey: { name: 'id_ruta', allowNull: false }, as: 'stops', onDelete: 'CASCADE' });
Parada.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: false } });

// Ruta ↔ Unidades
Ruta.hasMany(Unidad, { foreignKey: { name: 'id_ruta', allowNull: true } });
Unidad.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });

// Institucion ↔ Contratos (1–1 por UNIQUE id_institucion)
Institucion.hasOne(Contratos, { foreignKey: { name: 'id_institucion', unique: true } });
Contratos.belongsTo(Institucion, { foreignKey: { name: 'id_institucion', unique: true } });

// Conductores ↔ Contratos (1–1 por UNIQUE id_conductor)
Conductor.hasOne(Contratos, { foreignKey: { name: 'id_conductor', unique: true } });
Contratos.belongsTo(Conductor, { foreignKey: { name: 'id_conductor', unique: true } });

// unidad ↔ Jornada (PK = fecha)
Unidad.hasMany(Jornada, { foreignKey: { name: 'id_unidad', allowNull: false } });
Jornada.belongsTo(Unidad, { foreignKey: { name: 'id_unidad', allowNull: false } });


// Jornada(fecha) ↔ UsoIntencion.id_jornada (DATE FK)
Jornada.hasMany(UsoIntencion, { foreignKey: { name: 'id_jornada', allowNull: false } });
UsoIntencion.belongsTo(Jornada, { foreignKey: { name: 'id_jornada', allowNull: false } });


// Usuarios ↔ UsoIntencion
Usuario.hasMany(UsoIntencion, { foreignKey: { name: 'id_usuario', allowNull: false } });
UsoIntencion.belongsTo(Usuario, { foreignKey: { name: 'id_usuario', allowNull: false } });


// Unidades ↔ UsoIntencion
//Unidad.hasMany(UsoIntencion, { foreignKey: { name: 'id_unidad', allowNull: false } });
//UsoIntencion.belongsTo(Unidad, { foreignKey: { name: 'id_unidad', allowNull: false } });


// Ruta ↔ Reportes
Ruta.hasMany(Reportes, { foreignKey: { name: 'id_ruta', allowNull: false } });
Reportes.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: false } });

// Usuarios ↔ Reportes
Usuario.hasMany(Reportes, { foreignKey: { name: 'id_usuario', allowNull: true } });
Reportes.belongsTo(Usuario, { foreignKey: { name: 'id_usuario', allowNull: true } });
// Conductores ↔ Reportes
Conductor.hasMany(Reportes, { foreignKey: { name: 'id_conductor', allowNull: true } });
Reportes.belongsTo(Conductor, { foreignKey: { name: 'id_conductor', allowNull: true } });

//Conductores ↔ Unidades
Unidad.hasOne(Conductor, { foreignKey: { name: 'id_unidad', unique: true } });
Conductor.belongsTo(Unidad, { foreignKey: { name: 'id_unidad', unique: true } });

// ParadaVisita ↔ Jornada
Jornada.hasMany(ParadaVisita, { foreignKey: { name: 'id_jornada', allowNull: false }, onDelete: 'CASCADE' });
ParadaVisita.belongsTo(Jornada, { foreignKey: { name: 'id_jornada', allowNull: false } });

// ParadaVisita ↔ Parada
Parada.hasMany(ParadaVisita, { foreignKey: { name: 'id_parada', allowNull: false } });
ParadaVisita.belongsTo(Parada, { foreignKey: { name: 'id_parada', allowNull: false } });

// ParadaVisita ↔ Conductor
Conductor.hasMany(ParadaVisita, { foreignKey: { name: 'id_conductor', allowNull: false } });
ParadaVisita.belongsTo(Conductor, { foreignKey: { name: 'id_conductor', allowNull: false } });

// Jornada ↔ Conductor
Conductor.hasMany(Jornada, { foreignKey: { name: 'id_conductor', allowNull: true } });
Jornada.belongsTo(Conductor, { foreignKey: { name: 'id_conductor', allowNull: true } });

// Jornada ↔ Ruta
Ruta.hasMany(Jornada, { foreignKey: { name: 'id_ruta', allowNull: true } });
Jornada.belongsTo(Ruta, { foreignKey: { name: 'id_ruta', allowNull: true } });

export const syncDB = async () => {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
};