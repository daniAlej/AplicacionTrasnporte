import { DataTypes, Model } from 'sequelize';


export default (sequelize) => {
    class Ruta extends Model {}
    Ruta.init({
        id_ruta: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre_ruta: { type: DataTypes.STRING(100), allowNull: false },
    }, {
        sequelize,
        modelName: 'Ruta',
        tableName: 'ruta',
        freezeTableName: true,
        timestamps: false
    });
    return Ruta;
};