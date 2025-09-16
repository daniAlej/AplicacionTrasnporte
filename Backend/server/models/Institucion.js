import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Institucion extends Model { }
    Institucion.init({
        id_institucion: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre_institucion: { type: DataTypes.STRING(150), allowNull: false },
        direccion: { type: DataTypes.STRING(255) },
        telefono: { type: DataTypes.STRING(20) },
        id_admin: { type: DataTypes.INTEGER, allowNull: false }
    }, { sequelize, modelName: 'Institucion', tableName: 'Institucion', freezeTableName: true, timestamps: false });
    return Institucion;
};