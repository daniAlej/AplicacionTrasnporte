import { DataTypes, Model } from 'sequelize';


export default (sequelize) => {
    class Role extends Model {}
    Role.init({
        id_rol: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(50), allowNull: false }
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        freezeTableName: true,
        timestamps: false
    });
    return Role;
}