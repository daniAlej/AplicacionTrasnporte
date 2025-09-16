import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Contratos extends Model { }
    Contratos.init({
        id_contratos: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        fecha_inicio: { type: DataTypes.DATEONLY },
        fecha_final: { type: DataTypes.DATEONLY },
        descripcion: { type: DataTypes.STRING(255) },
        id_institucion: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        id_conductor: { type: DataTypes.INTEGER, allowNull: false, unique: true }
    }, { sequelize, modelName: 'Contratos', tableName: 'Contratos', freezeTableName: true, timestamps: false });
    return Contratos;
};