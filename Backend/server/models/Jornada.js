import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Jornada extends Model { }
    Jornada.init({
        id_jornada: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        fecha: { type: DataTypes.DATE, allowNull: false },
        id_unidad: { type: DataTypes.INTEGER, allowNull: false },
    }, { sequelize, modelName: 'Jornada', tableName: 'Jornada', freezeTableName: true, timestamps: false });
    return Jornada;
};