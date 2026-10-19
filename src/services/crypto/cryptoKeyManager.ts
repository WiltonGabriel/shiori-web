/**
 * Gerenciador responsável exclusivamente pela derivação e retenção da CryptoKey AES-GCM.
 * Adere ao Princípio da Responsabilidade Única (SRP): Não cifra nem acessa localStorage.
 */
class CryptoKeyManager {
  private key: CryptoKey | null = null;
  private readonly salt = new TextEncoder().encode("shiori-client-entropy-v1");

  public async getEncryptionKey(): Promise<CryptoKey> {
    if (this.key) {
      return this.key;
    }

    const deviceFingerprint = `${navigator.userAgent}-${navigator.language}-${screen.colorDepth}`;
    const material = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(deviceFingerprint),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    this.key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.salt,
        iterations: 100_000,
        hash: "SHA-256",
      },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    return this.key;
  }
}

export const cryptoKeyManager = new CryptoKeyManager();
