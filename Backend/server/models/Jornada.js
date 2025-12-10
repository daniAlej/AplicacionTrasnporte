import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Jornada extends Model { }
    Jornada.init({
        id_jornada: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        fecha: { type: DataTypes.DATE, allowNull: false },
        id_unidad: { type: DataTypes.INTEGER, allowNull: false },
        id_conductor: { type: DataTypes.INTEGER, allowNull: true },
        id_ruta: { type: DataTypes.INTEGER, allowNull: true },
        hora_inicio: { type: DataTypes.DATE, allowNull: true }, // Cuando inició la jornada
        hora_fin: { type: DataTypes.DATE, allowNull: true }, // Cuando finalizó la jornada
        latitud_fin: { type: DataTypes.DECIMAL(10, 8), allowNull: true }, // Ubicación donde finalizó
        longitud_fin: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
        estado: {
            type: DataTypes.ENUM('pendiente', 'en_curso', 'completada', 'cancelada'),
            defaultValue: 'pendiente',
            allowNull: false
        },
        paradas_completadas: { type: DataTypes.INTEGER, defaultValue: 0 }, // Contador de paradas completadas
        paradas_totales: { type: DataTypes.INTEGER, defaultValue: 0 }, // Total de paradas en la ruta
    }, { sequelize, modelName: 'Jornada', tableName: 'Jornada', freezeTableName: true, timestamps: false });
    return Jornada;
};