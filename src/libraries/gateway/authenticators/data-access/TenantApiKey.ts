import { DataTypes } from 'sequelize';
import db from '../../../data-access/db-config';
import Tenant from './Tenant'; // Adjust path as needed

const TenantApiKey = db.define('TenantApiKey', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  tenantId: {
    type: DataTypes.UUID,
    references: {
      model: Tenant,
      key: 'id',
    },
  },
  apiKey: {
    type: DataTypes.STRING,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'TenantApiKey',
  timestamps: false,
});

TenantApiKey.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(TenantApiKey, { foreignKey: 'tenantId' });

export default  TenantApiKey;
