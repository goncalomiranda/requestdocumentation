import { DataTypes } from "sequelize";
import dbaccess from "../../../libraries/data-access/db-config";
import TenantModel from "../../../libraries/gateway/authenticators/data-access/Tenant"; // Import TenantModel at the top

const MortageApplication = dbaccess.define(
  "ApplicationForm",
  {
    application_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'MORTGAGE'
    },
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
    application_form: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    application_form_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0'
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
        model: "Tenant", // Use string reference instead of model object
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    consentGiven: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    consentVersion: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    givenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    consentTimezone: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    browserLanguage: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
  },
  {
    tableName: "ApplicationForm",
    timestamps: false,
  }
);

// Define associations
TenantModel.hasMany(MortageApplication, { foreignKey: "tenant_id" });
MortageApplication.belongsTo(TenantModel, { foreignKey: "tenant_id" });

export default MortageApplication;
