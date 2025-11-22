import crypto from "crypto";
import logger from "../loggers/logger";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * The key should be a 32-byte (256-bit) hex string
 */
function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            "ENCRYPTION_KEY environment variable is not set. Please add a 32-byte hex string to .env file."
        );
    }

    // Convert hex string to buffer
    const keyBuffer = Buffer.from(key, "hex");

    if (keyBuffer.length !== 32) {
        throw new Error(
            "ENCRYPTION_KEY must be a 32-byte (64 character) hex string. " +
            `Current length: ${keyBuffer.length} bytes`
        );
    }

    return keyBuffer;
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string|object} data - Data to encrypt (will be stringified if object)
 * @returns {string} - Encrypted data as base64 string with salt, IV, and auth tag
 */
export function encrypt(data: string | object): string {
    try {
        // Convert data to string if it's an object
        const text = typeof data === "string" ? data : JSON.stringify(data);

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Get encryption key
        const key = getKey();

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt the data
        const encrypted = Buffer.concat([
            cipher.update(text, "utf8"),
            cipher.final(),
        ]);

        // Get authentication tag
        const tag = cipher.getAuthTag();

        // Combine salt + IV + tag + encrypted data
        const result = Buffer.concat([salt, iv, tag, encrypted]);

        // Return as base64
        return result.toString("base64");
    } catch (error) {
        logger.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
}

/**
 * Decrypt data encrypted with encrypt()
 * @param {string} encryptedData - Base64 encrypted string
 * @returns {string} - Decrypted data as string
 */
export function decrypt(encryptedData: string): string {
    try {
        // Convert from base64
        const buffer = Buffer.from(encryptedData, "base64");

        // Extract components using subarray (slice is deprecated)
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = buffer.subarray(ENCRYPTED_POSITION);

        // Get encryption key
        const key = getKey();

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt the data
        const decrypted = decipher.update(encrypted) + decipher.final("utf8");

        return decrypted;
    } catch (error) {
        logger.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}

/**
 * Encrypt and return object (convenience method)
 * @param {object} obj - Object to encrypt
 * @returns {string} - Encrypted string
 */
export function encryptObject(obj: object): string {
    return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt and parse as object (convenience method)
 * @param {string} encryptedData - Encrypted string
 * @returns {object} - Decrypted and parsed object
 */
export function decryptObject(encryptedData: string): any {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted);
}

/**
 * Generate a new encryption key (for setup)
 * Run this once and store the result in .env as ENCRYPTION_KEY
 * @returns {string} - 32-byte hex string
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
}
