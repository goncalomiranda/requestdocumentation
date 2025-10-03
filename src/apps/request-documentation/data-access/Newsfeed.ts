import { DataTypes } from "sequelize";
import dbaccess from "../../../libraries/data-access/db-config";
import TenantModel from "../../../libraries/gateway/authenticators/data-access/Tenant";

const Newsfeed = dbaccess.define(
    "Newsfeed",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        tenant_id: {
            type: DataTypes.STRING(191),
            allowNull: false,
            references: {
                model: TenantModel,
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        customer_id: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        request_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        operation: {
            type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
            allowNull: false,
        },
        old_status: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        new_status: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        changed_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        tableName: "Newsfeed",
        timestamps: false,
        indexes: [
            {
                name: 'idx_tenant',
                fields: ['tenant_id']
            },
            {
                name: 'idx_customer',
                fields: ['customer_id']
            }
        ]
    }
);

// Define associations
TenantModel.hasMany(Newsfeed, { foreignKey: "tenant_id" });
Newsfeed.belongsTo(TenantModel, { foreignKey: "tenant_id" });

export default Newsfeed;