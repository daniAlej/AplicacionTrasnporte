import { DataTypes, Model } from 'sequelize';


export default (sequelize) => {
    class RutaCoord extends Model {}
    RutaCoord.init({
        id_RutaCoord: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_ruta: { type: DataTypes.INTEGER, allowNull: false },
        lat: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
        lng: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
        orden: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        sequelize,
        modelName: 'RutaCoord',
        tableName: 'rutacoord',
        freezeTableName: true,
        timestamps: false
    });
    return RutaCoord;
};