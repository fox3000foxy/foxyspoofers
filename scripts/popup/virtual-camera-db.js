class VirtualCameraDB {
    static open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('virtualCameraDB', 2);
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos');
                if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
                if (!db.objectStoreNames.contains('hashes')) db.createObjectStore('hashes');
            };
            request.onsuccess = function(event) {
                resolve(event.target.result);
            };
            request.onerror = function(event) { reject(event.target.error); };
        });
    }
}
window.VirtualCameraDB = VirtualCameraDB;