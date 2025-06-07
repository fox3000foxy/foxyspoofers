import { CONFIG } from './config.js';

export class DatabaseManager {
    static async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                ['videos', 'state', 'hashes'].forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                });
            };
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async getValue(storeName, key) {
        try {
            const db = await this.openDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = () => resolve(null);
            });
        } catch (error) {
            console.log('%c[Error]%c [VirtualCamera] Erreur lors de la lecture de ' + storeName + ':', 'color: red; font-weight: bold;', '', error);
            return null;
        }
    }

    static async getVideoBlob() {
        const data = await this.getValue('videos', 'video');
        return data ? URL.createObjectURL(new Blob([data])) : null;
    }

    static async getState() {
        return !!(await this.getValue('state', 'virtualCameraOn'));
    }

    static async getVideoHash() {
        return await this.getValue('hashes', 'videoHash');
    }
}
