import { Injectable } from '@angular/core';
import { StorageKey } from "@app/enums";

@Injectable({
  providedIn: 'root'
})
export class VirtualStorageService {

  constructor() { }
  public localStorage = {
    saveData(key: string, value: string) {
      localStorage.setItem(key, value);
    },

    getData(key: string) {
      return localStorage.getItem(key)
    },
    removeData(key: string) {
      localStorage.removeItem(key);
    },

    clearData() {
      localStorage.clear();
    }
  }
  public sessionStorage = {
    saveData(key: string, value: string) {
      try {
        sessionStorage.setItem(key, value);
      } catch (error) {
        console.log(error);

      }
    },

    getData(key: string) {
      try {
        return sessionStorage.getItem(key)
      } catch (error) {
        console.log(error);
        return null
      }
    },
    removeData(key: string) {
      sessionStorage.removeItem(key);
    },

    clearData() {
      sessionStorage.clear();
    }
  }
  public indexDB = {
    async openDB(dbName: string, version: number = 1) {
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(dbName)) {
            db.createObjectStore(dbName);
          }
        };
      });
    },

    async saveData(dbName: string, key: string, value: any) {
      try {
        const db = await this.openDB(dbName);
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(dbName, 'readwrite');
          const store = transaction.objectStore(dbName);
          const request = store.put(value, key);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();

          transaction.oncomplete = () => db.close();
        });
      } catch (error) {
        console.error('IndexedDB saveData error:', error);
        throw error;
      }
    },

    async getData(dbName: string, key: string) {
      try {
        const db = await this.openDB(dbName);
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(dbName, 'readonly');
          const store = transaction.objectStore(dbName);
          const request = store.get(key);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);

          transaction.oncomplete = () => db.close();
        });
      } catch (error) {
        console.error('IndexedDB getData error:', error);
        return null;
      }
    },

    async removeData(dbName: string, key: string) {
      try {
        const db = await this.openDB(dbName);
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(dbName, 'readwrite');
          const store = transaction.objectStore(dbName);
          const request = store.delete(key);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();

          transaction.oncomplete = () => db.close();
        });
      } catch (error) {
        console.error('IndexedDB removeData error:', error);
        throw error;
      }
    },

    async clearData(dbName: string) {
      try {
        const db = await this.openDB(dbName);
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(dbName, 'readwrite');
          const store = transaction.objectStore(dbName);
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();

          transaction.oncomplete = () => db.close();
        });
      } catch (error) {
        console.error('IndexedDB clearData error:', error);
        throw error;
      }
    }
  }

  /**
   * Sets a cooldown period of one month for a given storage key.
   * Stores the expiration date in localStorage to prevent future access until the cooldown period ends.
   *
   * @param {StorageKey} key - The storage key to apply the cooldown period to
   */
  public hideWithOneMonthCooldown(key: StorageKey) {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    this.localStorage.saveData(key, expirationDate.toISOString());
  };

  /**
   * Checks if a countdown period has expired for a given storage key.
   * Removes the stored data if the countdown has expired.
   *
   * @param {StorageKey} key - The storage key associated with the countdown period
   * @returns {boolean} True if the countdown period has expired, false otherwise
   */
  public isCountdownExpired(key: StorageKey): boolean {
    const savedDate = this.localStorage.getData(key);
    if (!savedDate) return true;

    const expirationDate = new Date(savedDate);
    if (expirationDate < new Date()) {
      this.localStorage.removeData(key);
      return true;
    }

    return false;
  }
}
