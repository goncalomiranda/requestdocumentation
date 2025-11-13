CREATE TABLE `ApplicationForm` (
  `application_type` VARCHAR(100) NOT NULL DEFAULT 'MORTGAGE',
  `request_id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(100) NOT NULL,
  `unique_link` VARCHAR(100) NOT NULL,
  `requested_documents` JSON NOT NULL,
  `application_form` JSON NULL,
  `application_form_version` VARCHAR(20) NULL DEFAULT '1.0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` DATETIME NOT NULL,
  `status` VARCHAR(100) NOT NULL,
  `lang` VARCHAR(100) NOT NULL,
  `folder` VARCHAR(100) NOT NULL,
  `tenant_id` VARCHAR(191) NOT NULL,
  `consentGiven` BOOLEAN NULL,
  `consentVersion` VARCHAR(32) NULL,
  `givenAt` DATETIME NULL,
  `consentTimezone` VARCHAR(64) NULL,
  `userAgent` VARCHAR(255) NULL,
  `browserLanguage` VARCHAR(32) NULL,
  `consentA` BOOLEAN NULL,
  `consentB` BOOLEAN NULL,
  `consentC` BOOLEAN NULL,
  `consentD` BOOLEAN NULL,

  CONSTRAINT `fk_applicationform_tenant`
    FOREIGN KEY (`tenant_id`)
    REFERENCES `Tenant`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_applicationform_tenant_id` ON `ApplicationForm`(`tenant_id`);
CREATE INDEX `idx_applicationform_status` ON `ApplicationForm`(`status`);
CREATE INDEX `idx_applicationform_expiry_date` ON `ApplicationForm`(`expiry_date`);
