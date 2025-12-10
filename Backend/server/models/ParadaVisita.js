import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
    class ParadaVisita extends Model { }
    ParadaVisita.init({
        id_parada_visita: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_jornada: { type: DataTypes.INTEGER, allowNull: false },
        id_parada: { type: DataTypes.INTEGER, allowNull: false },
        id_conductor: { type: DataTypes.INTEGER, allowNull: false },
        fecha_hora_llegada: { type: DataTypes.DATE, allowNull: true }, // Cuando llegó a la parada
        fecha_hora_confirmacion: { type: DataTypes.DATE, allowNull: true }, // Cuando confirmó la parada
        latitud_confirmacion: { type: DataTypes.DECIMAL(10, 8), allowNull: true }, // Ubicación donde confirmó
        longitud_confirmacion: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
        distancia_metros: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // Distancia a la parada al confirmar
        estado: {
            type: DataTypes.ENUM('pendiente', 'confirmada', 'omitida', 'expirada'),
            defaultValue: 'pendiente',
            allowNull: false
        },
        orden_visita: { type: DataTypes.INTEGER, allowNull: true }, // Orden en que visitó las paradas
        tiempo_espera_segundos: { type: DataTypes.INTEGER, allowNull: true }, // Tiempo que esperó en la parada
    }, {
        sequelize,
        modelName: 'ParadaVisita',
        tableName: 'parada_visita',
        freezeTableName: true,
        timestamps: true, // Para tener createdAt y updatedAt
        createdAt: 'fecha_creacion',
        updatedAt: 'fecha_actualizacion'
    });
    return ParadaVisita;
};
