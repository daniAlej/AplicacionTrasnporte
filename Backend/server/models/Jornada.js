import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Jornada extends Model { }
    Jornada.init({
        fecha: { type: DataTypes.DATEONLY, primaryKey: true },
    }, { sequelize, modelName: 'Jornada', tableName: 'Jornada', freezeTableName: true, timestamps: false });
    return Jornada;
};