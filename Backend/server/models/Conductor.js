import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Conductor extends Model {}
  Conductor.init({
    id_conductor: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    correo: { 
      type: DataTypes.STRING(120), 
      allowNull: false, 
      unique: 'correo_unique', // Evita duplicados 
      
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
    licencia: { 
      type: DataTypes.STRING(50), 
      allowNull: false,  // en tu SQL es NOT NULL
    },
    estado: {
      type: DataTypes.ENUM('activo','inactivo'), // igual que tu SQL
      defaultValue: 'activo',
      allowNull: false
    },
    id_unidad: { type: DataTypes.INTEGER, allowNull: false },

  }, {
    sequelize,
    modelName: 'Conductor',
    tableName: 'Conductores',   // igual que en SQL
    freezeTableName: true,
    timestamps: false
  });
  return Conductor;
};
