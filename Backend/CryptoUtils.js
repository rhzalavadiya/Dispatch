const crypto = require("crypto");

console.log("✅ CryptoUtils loaded (COMPATIBLE VERSION)");

// 🔐 IV must match .NET exactly
const rgbIV = Buffer.from([18, 52, 86, 120, 144, 171, 205, 239]);

// 🔑 MUST be exactly 8 chars for DES
const ENCRYPTION_KEY = "27102011";

/**
 * Create DES-compatible 8-byte key buffer
 * DO NOT change this logic
 */
function getKeyBuffer(key) {
    if (!key) {
        throw new Error("Encryption key is undefined");
    }

    const keyBuffer = Buffer.alloc(8);
    Buffer.from(key, "utf8").copy(
        keyBuffer,
        0,
        0,
        Math.min(key.length, 8)
    );

    return keyBuffer;
}

/**
 * Encrypt plain text → Base64
 */
function encrypt(text, key = ENCRYPTION_KEY) {
    const cipher = crypto.createCipheriv(
        "des-cbc",
        getKeyBuffer(key),
        rgbIV
    );

    cipher.setAutoPadding(true); // PKCS7 (same as .NET)

    let encrypted = cipher.update(String(text), "utf8", "base64");
    encrypted += cipher.final("base64");

    return encrypted;
}

/**
 * Decrypt Base64 → plain text
 */
function decrypt(base64Text, key = ENCRYPTION_KEY) {
    const decipher = crypto.createDecipheriv(
        "des-cbc",
        getKeyBuffer(key),
        rgbIV
    );

    decipher.setAutoPadding(true);

    let decrypted = decipher.update(String(base64Text), "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
    ENCRYPTION_KEY
};
