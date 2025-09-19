-- Insert into Document table
INSERT INTO Document (id, doc_key) VALUES
  (UUID(), 'citizenship_card'),
  (UUID(), 'passport'),
  (UUID(), 'driver_license'),
  (UUID(), 'salary_slip'),
  (UUID(), 'identification'),
  (UUID(), 'tax_declaration'),
  (UUID(), 'crbp_map'),
  (UUID(), 'credit_report'),
  (UUID(), 'employment_contract'),
  (UUID(), 'own_capital_proof'),
  (UUID(), 'bank_statements_3m'),
  (UUID(), 'rgpd');

-- Insert translations for each document

-- Citizenship Card
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Citizenship Card' FROM Document d WHERE doc_key = 'citizenship_card';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Cartão de Cidadão' FROM Document d WHERE doc_key = 'citizenship_card';

-- Passport
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Passport' FROM Document d WHERE doc_key = 'passport';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Passaporte' FROM Document d WHERE doc_key = 'passport';

-- Driver License
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Driver''s License' FROM Document d WHERE doc_key = 'driver_license';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Carta de Condução' FROM Document d WHERE doc_key = 'driver_license';

-- Salary Slip
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Salary Slip' FROM Document d WHERE doc_key = 'salary_slip';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Recibo de Vencimento' FROM Document d WHERE doc_key = 'salary_slip';

-- Identification
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Identification (Citizenship Card)' FROM Document d WHERE doc_key = 'identification';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Identificação (Cartão do Cidadão)' FROM Document d WHERE doc_key = 'identification';

-- Tax Declaration
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Latest Tax Declaration' FROM Document d WHERE doc_key = 'tax_declaration';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Última Declaração de Impostos' FROM Document d WHERE doc_key = 'tax_declaration';

-- CRBP Map
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Bank of Portugal Credit Responsibilities Map (CRBP)' FROM Document d WHERE doc_key = 'crbp_map';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Mapa da Central de Responsabilidades do Banco de Portugal (CRBP)' FROM Document d WHERE doc_key = 'crbp_map';

-- Credit Report
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Credit Report' FROM Document d WHERE doc_key = 'credit_report';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Relatório de Crédito' FROM Document d WHERE doc_key = 'credit_report';

-- Employment Contract
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Employment Contract or Employer Declaration' FROM Document d WHERE doc_key = 'employment_contract';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Contrato de Trabalho ou Declaração da Entidade Empregadora' FROM Document d WHERE doc_key = 'employment_contract';

-- Own Capital Proof
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Proof of Own Capital Contribution' FROM Document d WHERE doc_key = 'own_capital_proof';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Prova da Existência dos Capitais Próprios a Aportar' FROM Document d WHERE doc_key = 'own_capital_proof';

-- Bank Statements 3 months
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'Last 3 Months Bank Statements (showing salary payments)' FROM Document d WHERE doc_key = 'bank_statements_3m';
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Extractos Bancários dos Últimos 3 Meses (com evidência do pagamento dos vencimentos)' FROM Document d WHERE doc_key = 'bank_statements_3m';


-- GDPR Consent Form
INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'en', 'GDPR Consent Form' FROM Document d WHERE doc_key = 'rgpd';

INSERT INTO DocumentTranslation (id, documentId, language, value)
SELECT UUID(), d.id, 'pt', 'Formulário de Consentimento RGPD' FROM Document d WHERE doc_key = 'rgpd';
