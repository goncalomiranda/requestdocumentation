import { DataTypes } from 'sequelize';
import dbaccess from '../../../libraries/data-access/db-config';

const DocumentModel = dbaccess.define('Document', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  doc_key: {
    type: DataTypes.STRING,
    unique: true,
  },
}, {
  tableName: 'Document',
  timestamps: false,
});

module.exports = DocumentModel;
