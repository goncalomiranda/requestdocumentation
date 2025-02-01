const Document = require('../data-access/Document'); // Adjust to your Sequelize instance
const Translation = require('../data-access/DocumentTranslation'); // Adjust to your Sequelize instance
import logger from '../../../libraries/loggers/logger';

export async function getDocumentsByLanguage(lang: string = "en") {
  const documents = await Document.findAll({
    include: [
      {
        model: Translation,
        as: "translations", // Ensure alias matches association
        where: { language: lang },
        attributes: ["value"],
      },
    ],
    attributes: ["doc_key"],
  });


  return {
    language: lang,
    documents: documents.map((doc : any) => ({
      key: doc.dataValues.doc_key,
      value:
        doc.dataValues.translations?.[0]?.dataValues?.value || "", // Safely access nested fields
    })),
  };
}