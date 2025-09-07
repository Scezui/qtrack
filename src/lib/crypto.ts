
'use server';

import CryptoJS from 'crypto-js';

// This function is defined once and captures the secret key.
// It will throw a clear error if the key is not set in the environment.
function getSecretKey() {
  const secretKey = process.env.NEXT_CRYPTO_SECRET_KEY;
  if (!secretKey) {
    console.error("CRITICAL: NEXT_CRYPTO_SECRET_KEY is not defined in the environment variables.");
    throw new Error('Encryption secret key is not configured on the server.');
  }
  // Ensure the secret key is of a valid length for AES-256 (32 bytes)
  return CryptoJS.enc.Utf8.parse(secretKey.padEnd(32, ' ').slice(0, 32));
}

const ensuredKey = getSecretKey();

export async function encrypt(text: string): Promise<string> {
  const iv = CryptoJS.lib.WordArray.random(16); // Generate a random 16-byte IV
  const encrypted = CryptoJS.AES.encrypt(text, ensuredKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // Prepend IV to the ciphertext for use in decryption
  return iv.toString(CryptoJS.enc.Hex) + encrypted.toString();
}

export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const iv = CryptoJS.enc.Hex.parse(ciphertext.slice(0, 32));
    const encryptedText = ciphertext.slice(32);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ensuredKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
        throw new Error('Decryption resulted in an empty string.');
    }
    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data.');
  }
}
