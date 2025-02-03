import { DataTypes } from "sequelize";
import dbaccess from "../../../libraries/data-access/db-config";
import TenantModel from "../../../libraries/gateway/authenticators/data-access/Tenant"; // Import TenantModel

const RequestedDocumentation = dbaccess.define(
  "RequestedDocumentation",
  {
    request_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    unique_link: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    requested_documents: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lang: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },    
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TenantModel,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "RequestedDocumentation",
    timestamps: false,
  }
);

// Define associations
TenantModel.hasMany(RequestedDocumentation, { foreignKey: "tenant_id" });
RequestedDocumentation.belongsTo(TenantModel, { foreignKey: "tenant_id" });

export default  RequestedDocumentation;
