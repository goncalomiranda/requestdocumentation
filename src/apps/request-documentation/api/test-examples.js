// Test examples for the new Document Types endpoints
// You can use these with your preferred API testing tool (Postman, Insomnia, curl, etc.)

// ==========================================
// 1. CREATE A NEW DOCUMENT TYPE
// ==========================================

// POST http://localhost:YOUR_PORT/api/request-documentation/documents
// Headers:
//   Content-Type: application/json
//   x-api-key: YOUR_API_KEY

const createDocumentExample = {
  doc_key: "utility_bill",
  translations: {
    en: "Utility Bill (Water, Electricity, or Gas)",
    pt: "Conta de Serviços Públicos (Água, Eletricidade ou Gás)",
  },
};

// Expected Response (201 Created):
const createResponse = {
  id: "uuid-generated-here",
  doc_key: "utility_bill",
  translations: {
    en: "Utility Bill (Water, Electricity, or Gas)",
    pt: "Conta de Serviços Públicos (Água, Eletricidade ou Gás)",
  },
};

// ==========================================
// 2. GET DOCUMENTS (verify creation)
// ==========================================

// GET http://localhost:YOUR_PORT/api/request-documentation/documents?lang=en
// Headers:
//   x-api-key: YOUR_API_KEY

// Expected Response (200 OK):
const getDocumentsResponse = {
  language: "en",
  documents: [
    { key: "citizenship_card", value: "Citizenship Card" },
    { key: "passport", value: "Passport" },
    { key: "utility_bill", value: "Utility Bill (Water, Electricity, or Gas)" },
    // ... other documents
  ],
};

// ==========================================
// 3. DELETE A DOCUMENT TYPE
// ==========================================

// DELETE http://localhost:YOUR_PORT/api/request-documentation/documents/utility_bill
// Headers:
//   x-api-key: YOUR_API_KEY

// Expected Response (200 OK):
const deleteResponse = {
  message: "Document type 'utility_bill' deleted successfully",
  doc_key: "utility_bill",
};

// ==========================================
// ERROR SCENARIOS
// ==========================================

// 1. Try to create with missing translations
const invalidCreate1 = {
  doc_key: "test_doc",
  // Missing translations
};
// Response (400 Bad Request):
// {
//   "error": "Bad request",
//   "message": "doc_key and translations (en, pt) are required"
// }

// 2. Try to create duplicate doc_key
const duplicateCreate = {
  doc_key: "citizenship_card", // Already exists
  translations: {
    en: "Test",
    pt: "Teste",
  },
};
// Response (409 Conflict):
// {
//   "error": "Document with doc_key 'citizenship_card' already exists"
// }

// 3. Try to delete non-existent document
// DELETE /api/request-documentation/documents/non_existent_doc
// Response (404 Not Found):
// {
//   "error": "Document with doc_key 'non_existent_doc' not found"
// }

module.exports = {
  createDocumentExample,
  createResponse,
  getDocumentsResponse,
  deleteResponse,
};
