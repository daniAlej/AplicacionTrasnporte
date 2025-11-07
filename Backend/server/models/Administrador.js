import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Administrador extends Model { }
    Administrador.init({
        id_admin: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuario: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        contrasena: { type: DataTypes.STRING(255), allowNull: false }
    }, { sequelize, modelName: 'Administrador', tableName: 'Administrador', freezeTableName: true, timestamps: false });
    return Administrador;
};