/**
 * Advanced Client-Side Cryptography (AES-256-GCM)
 * Encrypts private attendance, leave, and shift records with military-grade
 * authenticated encryption before transmission to the cloud database.
 */

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a strong AES-GCM 256-bit key from user ID & salt using PBKDF2
async function deriveEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('entrance_exit_secure_salt_2026_e2ee');

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any JS object with AES-256-GCM
 * Output format: base64(iv) + ":" + base64(ciphertext)
 */
export async function encryptData(data: any, secret: string): Promise<string> {
  try {
    const key = await deriveEncryptionKey(secret);
    const encoder = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const encodedData = encoder.encode(jsonString);

    // Generate random 12-byte initialization vector (IV) for each encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    const ivStr = bufferToBase64(iv.buffer);
    const cipherStr = bufferToBase64(encryptedBuffer);

    return `${ivStr}:${cipherStr}`;
  } catch (err: any) {
    console.error('Encryption failed:', err);
    throw new Error('خطا در رمزنگاری امن اطلاعات.');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string back into original data
 */
export async function decryptData<T>(encryptedString: string, secret: string): Promise<T> {
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 2) {
      throw new Error('قالب داده رمزنگاری‌شده نامعتبر است.');
    }

    const [ivStr, cipherStr] = parts;
    const iv = new Uint8Array(base64ToBuffer(ivStr));
    const cipherBuffer = base64ToBuffer(cipherStr);

    const key = await deriveEncryptionKey(secret);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (err: any) {
    console.error('Decryption failed:', err);
    throw new Error('خطا در رمزگشایی اطلاعات. کلید نامعتبر است یا اطلاعات دستکاری شده است.');
  }
}
