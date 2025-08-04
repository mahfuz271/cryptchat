import CryptoJS from "crypto-js";

// Generate RSA key pair in browser
export async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await exportKeyToPem(keyPair.publicKey, "spki");
    const privateKey = await exportKeyToPem(keyPair.privateKey, "pkcs8");

    return { publicKey, privateKey };
  } catch (error) {
    console.error("Key generation error:", error);
    throw error;
  }
}

// Import RSA public key from PEM format
export async function importPublicKey(pem: string) {
  try {
    const pemContents = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\s+/g, "");
    const binaryDer = base64ToArrayBuffer(pemContents);

    return await window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Public key import error:", error);
    throw error;
  }
}

// Import RSA private key from PEM format
export async function importPrivateKey(pem: string) {
  try {
    const pemContents = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s+/g, "");
    const binaryDer = base64ToArrayBuffer(pemContents);

    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Private key import error:", error);
    throw error;
  }
}

// Encrypt message with recipient's public key
export async function encryptMessage(
  message: string | undefined,
  publicKeyPem: string | undefined
): Promise<string> {
  if (!message || !publicKeyPem) {
    throw new Error("Both encrypted message and public key are required");
  }
  try {
    const publicKey = await importPublicKey(publicKeyPem);
    const encodedMessage = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      encodedMessage
    );

    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error("Message encryption error:", error);
    throw error;
  }
}

// Decrypt message with user's private key
export async function decryptMessage(
  encryptedMessage: string | undefined,
  privateKeyPem: string | undefined
): Promise<string> {
  if (!encryptedMessage || !privateKeyPem) {
    throw new Error("Both encrypted message and private key are required");
  }
  try {
    const privateKey = await importPrivateKey(privateKeyPem);
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Message decryption error:", error);
    throw error;
  }
}

// AES encryption of private key
export function encryptPrivateKey(
  privateKey: string,
  password: string
): string {
  return CryptoJS.AES.encrypt(privateKey, password).toString();
}

// AES decryption of private key
export function decryptPrivateKey(
  encryptedPrivateKey: string,
  password: string
): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error("Decryption failed - possibly wrong password");
    }
    return decrypted;
  } catch (error) {
    console.error("Private key decryption error:", error);
    throw error;
  }
}

// Helper functions
async function exportKeyToPem(key: CryptoKey, format: "spki" | "pkcs8") {
  const exported = await window.crypto.subtle.exportKey(format, key);
  const exportedAsString = arrayBufferToBase64(exported);

  const type = format === "spki" ? "PUBLIC KEY" : "PRIVATE KEY";
  return `-----BEGIN ${type}-----\n${exportedAsString
    .match(/.{1,64}/g)
    ?.join("\n")}\n-----END ${type}-----`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
