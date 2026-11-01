import type { ItemCatalogoResponse } from "../../types/catalog.types";

const DB_NAME = "shiori_db";
const DB_VERSION = 1;
const STORE_NAME = "shelf_items";

/**
 * Camada Nativa de Armazenamento Local via IndexedDB (Uncle Bob - SRP).
 * Supera o limite de 5MB do LocalStorage, permitindo armazenamento seguro e
 * ilimitado de banners e capas em WebP, anotações e histórico de leitura.
 */
export class IndexedDbShelf {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static isSupported(): boolean {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
  }

  public static async getDb(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error("IndexedDB não está disponível neste ambiente.");
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("obraId", "obraId", { unique: false });
          store.createIndex("statusLeitura", "statusLeitura", { unique: false });
          store.createIndex("ultimaAtualizacao", "ultimaAtualizacao", { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error("Falha ao abrir banco IndexedDB Shiori"));
      };

      request.onblocked = () => {
        console.warn("Abertura do IndexedDB bloqueada por outra aba ativa.");
      };
    });

    return this.dbPromise;
  }

  public static async getAll(): Promise<ItemCatalogoResponse[]> {
    if (!this.isSupported()) return [];
    const db = await this.getDb();
    return new Promise<ItemCatalogoResponse[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result || []) as ItemCatalogoResponse[];
        items.sort(
          (a, b) =>
            new Date(b.ultimaAtualizacao).getTime() - new Date(a.ultimaAtualizacao).getTime()
        );
        resolve(items);
      };

      req.onerror = () => reject(req.error || new Error("Falha ao listar itens do IndexedDB"));
    });
  }

  public static async getById(id: number): Promise<ItemCatalogoResponse | null> {
    if (!this.isSupported()) return null;
    const db = await this.getDb();
    return new Promise<ItemCatalogoResponse | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve((req.result as ItemCatalogoResponse) || null);
      };

      req.onerror = () => reject(req.error || new Error(`Falha ao obter item ${id} do IndexedDB`));
    });
  }

  public static async put(item: ItemCatalogoResponse): Promise<void> {
    if (!this.isSupported()) return;
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Falha ao salvar item ${item.id} no IndexedDB`));
    });
  }

  public static async putBatch(items: ItemCatalogoResponse[]): Promise<void> {
    if (!this.isSupported() || items.length === 0) return;
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      items.forEach((item) => {
        store.put(item);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Falha ao salvar lote de itens no IndexedDB"));
    });
  }

  public static async delete(id: number): Promise<void> {
    if (!this.isSupported()) return;
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Falha ao remover item ${id} do IndexedDB`));
    });
  }

  public static async clear(): Promise<void> {
    if (!this.isSupported()) return;
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Falha ao limpar estante do IndexedDB"));
    });
  }

  public static async count(): Promise<number> {
    if (!this.isSupported()) return 0;
    const db = await this.getDb();
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Falha ao contar itens do IndexedDB"));
    });
  }
}
