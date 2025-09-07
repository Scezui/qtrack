
'use server';

import CryptoJS from 'crypto-js';

const secretKey = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY;

if (!secretKey) {
  throw new Error('NEXT_PUBLIC_CRYPTO_SECRET_KEY is not defined in the environment variables.');
}

// Ensure the secret key is of a valid length for AES-256 (32 bytes)
const ensuredKey = CryptoJS.enc.Utf8.parse(secretKey.padEnd(32, ' ').slice(0, 32));

export function encrypt(text: string): string {
  const iv = CryptoJS.lib.WordArray.random(16); // Generate a random 16-byte IV
  const encrypted = CryptoJS.AES.encrypt(text, ensuredKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // Prepend IV to the ciphertext for use in decryption
  return iv.toString(CryptoJS.enc.Hex) + encrypted.toString();
}

export function decrypt(ciphertext: string): string {
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
