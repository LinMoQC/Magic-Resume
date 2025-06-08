import { MagicDebugger } from "./debuggger";

class IndexedDBClient {
  private dbName: string;
  private storeNames: string[];
  private db: IDBDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(dbName: string, storeNames: string[]) {
    this.dbName = dbName;
    this.storeNames = storeNames;
    this.init();
  }

  public init(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve, reject) => {
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
    
    return this.initializationPromise;
  }

  private async getObjectStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    // 确保初始化已完成
    await this.initializationPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized.');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  public async setItem<T>(storeName: string, key: string, value: T): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async getItem<T>(storeName: string, key: string): Promise<T | null> {
    const store = await this.getObjectStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = (event) => resolve((event.target as IDBRequest).result || null);
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async deleteItem(storeName: string, key: string): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    const store = await this.getObjectStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
  }
}

const dbClient = new IndexedDBClient('Magic-Resume', ['resumes', 'settings']);

export { dbClient };
