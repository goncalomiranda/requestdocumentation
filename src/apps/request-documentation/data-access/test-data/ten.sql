-- test data

-- Insert a new Tenant
INSERT INTO Tenant (id, name, crmProvider, storageProvider, email) VALUES
  (UUID(), 'Goncalo Miranda', 'STREAK', 'GDRIVE', 'miranda.gs@gmail.com');

  INSERT INTO Tenant (id, name, crmProvider, storageProvider, email) VALUES
  (UUID(), 'GM Dev', 'STREAK', 'GDRIVE', 'gm@goncalomiranda.dev');

-- Insert API keys for the Tenant
INSERT INTO TenantApiKey (id, tenantId, apiKey) 
SELECT UUID(), id, SHA2(UUID(), 256) FROM Tenant WHERE name = 'Goncalo Miranda'
UNION ALL
SELECT UUID(), id, SHA2(UUID(), 256) FROM Tenant WHERE name = 'GM Dev';
