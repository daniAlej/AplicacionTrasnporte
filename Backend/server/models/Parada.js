import { DataTypes, Model } from 'sequelize';


export default (sequelize) => {
    class Parada extends Model {}
    Parada.init({
        id_parada: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre_parada: { type: DataTypes.STRING(120), allowNull: false },
        lat: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
        lng: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
        orden: { type: DataTypes.INTEGER, allowNull: true },
        id_ruta: { type: DataTypes.INTEGER, allowNull: false }
    }, {
        sequelize,
        modelName: 'Parada',
        tableName: 'parada',
        freezeTableName: true,
        timestamps: false
    });
    return Parada;
};