import { DataTypes } from 'sequelize';
import database from '../../../data-access/db-config';

const TenantModel = database.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
  },
  crmProvider: {
    type: DataTypes.STRING,
  },
  storageProvider: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
}, {
  tableName: 'Tenant',
  timestamps: false, // If you don't want timestamps
});

export default TenantModel;
