import { DataTypes } from 'sequelize';
import dbaccess from '../../../libraries/data-access/db-config';
import Document from './Document';

const DocumentTranslation = dbaccess.define('DocumentTranslation', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  language: {
    type: DataTypes.STRING,
  },
  value: {
    type: DataTypes.STRING,
  },
  documentId: {
    type: DataTypes.UUID,
    references: {
      model: Document,
      key: 'id',
    },
  },
}, {
  tableName: 'DocumentTranslation',
  timestamps: false,
});

// ✅ Define alias properly
DocumentTranslation.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
Document.hasMany(DocumentTranslation, { foreignKey: 'documentId', as: 'translations' });


export default DocumentTranslation;
