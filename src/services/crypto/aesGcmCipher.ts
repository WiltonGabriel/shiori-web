import { cryptoKeyManager } from "./cryptoKeyManager";

/**
 * Cifrador responsável exclusivamente por operações criptográficas AES-GCM (cifragem/decifragem).
 * Adere ao Princípio da Responsabilidade Única (SRP): Não conhece storage nem regras de negócio.
 */
export class AesGcmCipher {
  public static async encrypt(plainText: string): Promise<string> {
    const key = await cryptoKeyManager.getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  public static async decrypt(cipherBase64: string): Promise<string> {
    const key = await cryptoKeyManager.getEncryptionKey();
    const binaryStr = atob(cipherBase64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    return new TextDecoder().decode(decryptedBuffer);
  }
}
