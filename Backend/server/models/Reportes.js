import { DataTypes, Model } from 'sequelize';
export default (sequelize) => {
    class Reportes extends Model { }
    Reportes.init({
        id_reporte: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tipo: { type: DataTypes.ENUM('atraso', 'desvio', 'cumplimiento'), allowNull: false },
        descripcion: { type: DataTypes.STRING(255) },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        foto_url: { type: DataTypes.STRING(255), allowNull: true },
        id_ruta: { type: DataTypes.INTEGER, allowNull: false },
        id_usuario: { type: DataTypes.INTEGER, allowNull: true },
        id_conductor: { type: DataTypes.INTEGER, allowNull: true },
        latitud: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
        longitud: { type: DataTypes.DECIMAL(11, 8), allowNull: true },

    }, {
        sequelize, modelName: 'Reportes', tableName: 'Reportes', freezeTableName: true, timestamps: false,
        validate: {
            exactlyOneActor() {
                const u = this.id_usuario ?? null;
                const c = this.id_conductor ?? null;
                if ((u && c) || (!u && !c)) {
                    throw new Error("Debe existir exactamente uno de id_usuario o id_conductor.");
                }
            },
        },
    }

    );
    return Reportes;
};