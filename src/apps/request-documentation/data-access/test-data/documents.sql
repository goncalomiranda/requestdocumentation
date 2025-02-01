-- Insert into Document table
INSERT INTO Document (id, doc_key) VALUES
  (UUID(), 'citizenship_card'),
  (UUID(), 'passport'),
  (UUID(), 'driver_license'),
  (UUID(), 'salary_slip');

-- Insert translations for each document

-- Insert translations for each document
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Citizenship Card' FROM Document d WHERE doc_key = 'citizenship_card'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Cartão de Cidadão' FROM Document d WHERE doc_key = 'citizenship_card'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Passport' FROM Document d WHERE doc_key = 'passport'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Passaporte' FROM Document d WHERE doc_key = 'passport'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Driver\'s License' FROM Document d WHERE doc_key = 'driver_license'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Carta de Condução' FROM Document d WHERE doc_key = 'driver_license'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Salary Slip' FROM Document d WHERE doc_key = 'salary_slip'

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Recibo de Vencimento' FROM Document d WHERE doc_key = 'salary_slip';
