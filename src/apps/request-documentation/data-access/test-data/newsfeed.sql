CREATE TABLE Newsfeed (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(191) NOT NULL,
  customer_id VARCHAR(100) NOT NULL,
  request_id VARCHAR(255) NOT NULL,
  operation ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  old_status VARCHAR(100) DEFAULT NULL,
  new_status VARCHAR(100) DEFAULT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER $$

CREATE TRIGGER requested_docs_status_update
AFTER UPDATE ON RequestedDocumentation
FOR EACH ROW
BEGIN
  -- Only log when status actually changes
  IF NOT (OLD.status <=> NEW.status) THEN
    INSERT INTO Newsfeed (tenant_id, customer_id, request_id, operation, old_status, new_status)
    VALUES (NEW.tenant_id, NEW.customer_id, NEW.request_id, 'UPDATE', OLD.status, NEW.status);
  END IF;
END$$

DELIMITER ;
