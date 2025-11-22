# Google Drive OAuth Migration

## Overview

The `requestdocumentation` application has been migrated from using a Google service account to OAuth 2.0 authentication for Google Drive access. This change resolves the storage quota limitations of service accounts.

## Architecture

### Shared OAuth Token System

Both `gm-frontend` and `requestdocumentation` now share the same Google Drive OAuth token:

1. **Token Creation**: Only `gm-frontend` can create/authorize new OAuth tokens via its web interface
2. **Token Storage**: Tokens are encrypted and stored in a shared MySQL database (table: `Preferences`)
3. **Token Usage**: Both applications read and refresh the token from the shared database
4. **Encryption**: Tokens are encrypted using AES-256-GCM with a shared encryption key

### Components Added

1. **`src/libraries/utils/encryption.ts`**: Handles encryption/decryption of OAuth tokens
2. **`src/libraries/data-access/sharedDatabase.ts`**: Sequelize connection to shared database
3. **`src/libraries/data-access/models/SharedPreference.ts`**: Model for accessing the Preferences table
4. **Updated `src/libraries/googledrive/driveapi.ts`**: Now uses OAuth instead of service account

## Configuration

### Environment Variables

Add the following to your `.env` file (see `.env.example` for template):

```bash
# Shared database configuration (must match gm-frontend)
SHARED_DB_NAME=your_shared_db_name
SHARED_DB_USER=your_shared_db_user
SHARED_DB_PASSWORD=your_shared_db_password
SHARED_DB_HOST=your_shared_db_host

# Encryption key (MUST BE THE SAME as gm-frontend)
ENCRYPTION_KEY=your_64_character_hex_string

# Google OAuth credentials (MUST BE THE SAME as gm-frontend)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google-drive/callback

# Google Drive default folder
GOOGLE_DEFAULT_FOLDER=your_drive_folder_id
```

### Important Notes

1. **Same Credentials**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ENCRYPTION_KEY` must be identical in both applications
2. **Shared Database**: Both applications must connect to the same shared database
3. **Token Authorization**: OAuth tokens can only be created/authorized through `gm-frontend`
4. **Redirect URI**: Only needed for `gm-frontend`; `requestdocumentation` only reads existing tokens

## Setup Steps

### 1. Configure Shared Database

Ensure the shared database exists and both applications can access it:

```sql
-- The Preferences table should already exist from gm-frontend setup
-- If not, it will be created automatically by Sequelize
```

### 2. Copy Credentials from gm-frontend

Copy these values from your `gm-frontend/.env` to `requestdocumentation/.env`:

- `ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SHARED_DB_NAME`
- `SHARED_DB_USER`
- `SHARED_DB_PASSWORD`
- `SHARED_DB_HOST`

### 3. Authorize Google Drive (via gm-frontend)

1. Start `gm-frontend`
2. Navigate to the OAuth settings page
3. Click "Authorize Google Drive"
4. Complete the OAuth flow
5. The token will be encrypted and stored in the shared database

### 4. Test requestdocumentation

Once the token is created via `gm-frontend`, `requestdocumentation` can immediately use it:

```typescript
import { createFile } from './libraries/googledrive/driveapi';

// This will automatically fetch and use the OAuth token from shared database
await createFile(
  'test.pdf',
  'folder_id',
  'application/pdf',
  fileBuffer
);
```

## How It Works

### Token Retrieval and Refresh

When `requestdocumentation` needs to access Google Drive:

1. Retrieves encrypted token from `Preferences` table (key: `google_oauth_token`)
2. Decrypts the token using the shared `ENCRYPTION_KEY`
3. Checks if token is expired
4. If expired, automatically refreshes using the refresh token
5. Saves the refreshed token back to the database (encrypted)
6. Uses the token to authenticate Google Drive API calls

### Auto-Refresh Behavior

Both applications will automatically refresh the token when it expires. The refresh is transparent and doesn't require user intervention as long as the refresh token remains valid.

## Removed Components

The following service account configuration is no longer used:

- `GOOGLE_PROJECT_ID`
- `GOOGLE_PRIVATE_KEY_ID`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CLIENT_EMAIL`

These can be removed from your `.env` file.

## Troubleshooting

### "No Google OAuth token found" Error

**Cause**: No token exists in the shared database

**Solution**: Authorize Google Drive through `gm-frontend` first

### "Failed to decrypt data" Error

**Cause**: `ENCRYPTION_KEY` mismatch between applications

**Solution**: Ensure both applications use the exact same `ENCRYPTION_KEY`

### "Insufficient permissions" Error

**Cause**: The authorized Google account doesn't have access to the target folder

**Solution**: Ensure the Google account that authorized the OAuth token has Editor permissions on the Google Drive folder

### Token Refresh Failures

**Cause**: Refresh token may be invalid or revoked

**Solution**: Re-authorize through `gm-frontend` to generate a new token

## Migration Benefits

1. **No Storage Quota**: User OAuth tokens don't have the 15GB limit of service accounts
2. **Simplified Management**: No need to manage service account keys
3. **Shared Tokens**: Single authorization works for multiple applications
4. **Auto-Refresh**: Tokens refresh automatically without user intervention
5. **Secure**: Tokens are encrypted at rest in the database

## Security Considerations

1. **Encryption Key**: Keep `ENCRYPTION_KEY` secret and never commit to version control
2. **Database Access**: Secure the shared database with strong credentials
3. **Token Rotation**: Consider periodic re-authorization for security
4. **Access Control**: Only authorized users (via `gm-frontend`) can create tokens
