import prisma from "../../../libraries/data-access/prismaClient"; 

export async function getDocumentsByLanguage(lang: string = "en") {
  const documents = await prisma.document.findMany({
    select: {
      doc_key: true,
      translations: {
        where: {
          language: lang,
        },
        select: {
          value: true,
        },
      },
    },
  });

  return {
    language: lang,
    documents: documents.map((doc) => ({
      key: doc.doc_key,
      value: doc.translations[0]?.value || "", // Fallback to empty string if no translation exists
    })),
  };
}