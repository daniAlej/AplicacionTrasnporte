import { DataTypes, Model } from 'sequelize';


export default (sequelize) => {
    class RolConductor extends Model {}
    RolConductor.init({
        id_rolConductor: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(50), allowNull: false }
    }, {
        sequelize,
        modelName: 'RolConductor',
        tableName: 'rolConductor',
        freezeTableName: true,
        timestamps: false
    });
    return RolConductor;
}