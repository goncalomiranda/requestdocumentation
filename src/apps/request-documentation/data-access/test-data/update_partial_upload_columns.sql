-- Adds columns required for partial document uploads per token.
-- Safe to run multiple times.
-- Target table: RequestedDocumentation

SET @db_name := DATABASE();

-- uploaded_documents (JSON)
SET @has_uploaded_documents := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'RequestedDocumentation'
    AND COLUMN_NAME = 'uploaded_documents'
);
SET @sql := IF(
  @has_uploaded_documents = 0,
  'ALTER TABLE RequestedDocumentation ADD COLUMN uploaded_documents JSON NULL',
  'SELECT ''Column uploaded_documents already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- completed_at (DATETIME)
SET @has_completed_at := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'RequestedDocumentation'
    AND COLUMN_NAME = 'completed_at'
);
SET @sql := IF(
  @has_completed_at = 0,
  'ALTER TABLE RequestedDocumentation ADD COLUMN completed_at DATETIME NULL',
  'SELECT ''Column completed_at already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
