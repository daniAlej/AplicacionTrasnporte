import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
  class UsoIntencion extends Model {}
  UsoIntencion.init({
    id_uso: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    id_jornada: { type: DataTypes.INTEGER, allowNull: false },
    indicado: { type: DataTypes.BOOLEAN },
    confirmado: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { sequelize, modelName: 'UsoIntencion', tableName: 'UsoIntencion', freezeTableName: true, timestamps: false });
  return UsoIntencion;
};