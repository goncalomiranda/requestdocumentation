import Document from '../data-access/Document';
import Translation from '../data-access/DocumentTranslation';
import logger from '../../../libraries/loggers/logger';

export async function getDocumentsByLanguage(lang: string = "en") {
  const documents = await Document.findAll({
    include: [
      {
        model: Translation,
        as: "translations", // Ensure alias matches association
        where: { language: lang },
        attributes: ["value", "documentId"], // Fetch only the value and documentId to optimize query
      },
    ],
    attributes: ["id", "doc_key"],
  });

  logger.debug(`Fetched documents for language: ${JSON.stringify(documents)}`);
  return {
    language: lang,
    documents: documents.map((doc: any) => ({
      key: doc.dataValues.doc_key,
      value:
        doc.dataValues.translations?.[0]?.dataValues?.value || "", // Safely access nested fields
    })),
  };
}

export async function createDocumentType(doc_key: string, translations: { en: string; pt: string }) {
  logger.info(`Creating document type: ${doc_key}`);

  // Check if doc_key already exists
  const existingDocument = await Document.findOne({
    where: { doc_key },
  });

  if (existingDocument) {
    throw new Error(`Document with doc_key '${doc_key}' already exists`);
  }

  // Create the document
  const newDocument = await Document.create({
    doc_key,
  });

  // Create translations for both languages
  await Translation.create({
    documentId: newDocument.dataValues.id,
    language: 'en',
    value: translations.en,
  });

  await Translation.create({
    documentId: newDocument.dataValues.id,
    language: 'pt',
    value: translations.pt,
  });

  logger.info(`Document type created successfully: ${doc_key}`);

  return {
    id: newDocument.dataValues.id,
    doc_key: newDocument.dataValues.doc_key,
    translations: {
      en: translations.en,
      pt: translations.pt,
    },
  };
}

export async function deleteDocumentType(doc_key: string) {
  logger.info(`Deleting document type: ${doc_key}`);

  // Find the document
  const document = await Document.findOne({
    where: { doc_key },
  });

  if (!document) {
    throw new Error(`Document with doc_key '${doc_key}' not found`);
  }

  const documentId = document.dataValues.id;

  // Delete all translations first (foreign key constraint)
  await Translation.destroy({
    where: { documentId },
  });

  // Delete the document
  await Document.destroy({
    where: { doc_key },
  });

  logger.info(`Document type deleted successfully: ${doc_key}`);

  return {
    message: `Document type '${doc_key}' deleted successfully`,
    doc_key,
  };
}