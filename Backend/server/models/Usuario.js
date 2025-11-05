import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Usuario extends Model {}
  Usuario.init({
    id_usuario: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    correo: { 
      type: DataTypes.STRING(120), 
      allowNull: false, 
      unique: { name: 'unique_correo', msg: 'El correo ya está registrado'  },
      
    },
    contrasena: { 
      type: DataTypes.STRING(200), 
      allowNull: false,  // en tu SQL es NOT NULL
      field: 'contraseña' 
    },
    telefono: { 
      type: DataTypes.STRING(20), 
      allowNull: true,   // en SQL no es NOT NULL
      validate: {
        isNumeric: {
          msg: "El número de teléfono debe ser numérico",
          args: true
        },
        len: {
          args: [7, 10],
          msg: "El número telefónico debe tener entre 7 y 10 caracteres"
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('activo','inactivo'), // igual que tu SQL
      defaultValue: 'activo',
      allowNull: false
    },
    ultimo_login: {
      type: DataTypes.DATE,   // ✅ corregido
      allowNull: true
    },
    id_rol: { type: DataTypes.INTEGER, allowNull: false },
    id_ruta: { type: DataTypes.INTEGER, allowNull: true },
    id_parada: { type: DataTypes.INTEGER, allowNull: true },
    id_intitucion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios',   // igual que en SQL
    freezeTableName: true,
    timestamps: false
  });
  return Usuario;
};
