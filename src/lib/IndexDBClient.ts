import { MagicDebugger } from "./debuggger";

class IndexedDBClient {
  private dbName: string;
  private storeNames: string[];
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeNames: string[]) {
    this.dbName = dbName;
    this.storeNames = storeNames;
  }

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.storeNames.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
            MagicDebugger.log(`Object store "${storeName}" created.`);
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        MagicDebugger.log('IndexedDB initialized');
        resolve();
      };

      request.onerror = (event) => {
        MagicDebugger.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  public async setItem<T>(storeName: string, key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  public async getItem<T>(storeName: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readonly');
      const request = store.get(key);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result || null);
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  public async deleteItem(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  public async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
}

const dbClient = new IndexedDBClient('Magic-Resume', ['resumes', 'settings']);

export { dbClient };
