import { AesGcmCipher } from "./aesGcmCipher";

/**
 * Adaptador de armazenamento seguro tipado.
 * Cifra valores com AES-GCM antes de persistir no storage do navegador para impedir
 * vazamento de tokens de sessão ou URLs privadas em plain-text por extensões ou XSS.
 * Adere ao SRP: Gerencia apenas persistência criptografada.
 */
export class SecureStorage {
  public static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = await AesGcmCipher.encrypt(serialized);
      localStorage.setItem(`shiori_enc_${key}`, encrypted);
    } catch (error) {
      console.error(`Erro ao gravar chave segura [${key}]:`, error);
    }
  }

  public static async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(`shiori_enc_${key}`);
      if (!raw) return null;

      const decrypted = await AesGcmCipher.decrypt(raw);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.warn(`Chave segura inválida ou corrompida [${key}]. Removendo...`, error);
      this.removeItem(key);
      return null;
    }
  }

  public static removeItem(key: string): void {
    localStorage.removeItem(`shiori_enc_${key}`);
  }

  public static clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("shiori_enc_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
