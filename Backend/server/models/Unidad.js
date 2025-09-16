import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Unidad extends Model {}
  Unidad.init({
    id_unidad: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    placa: { type: DataTypes.STRING(100), allowNull: false },
    modelo: { type: DataTypes.STRING(120), allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
    estado: {
      type: DataTypes.ENUM('activo','inactivo'), // igual que tu SQL
      defaultValue: 'activo',
      allowNull: false
    },
    id_ruta: { type: DataTypes.INTEGER, allowNull: true },

  }, {
    sequelize,
    modelName: 'Unidad',
    tableName: 'Unidades',   // igual que en SQL
    freezeTableName: true,
    timestamps: false
  });
  return Unidad;
};
