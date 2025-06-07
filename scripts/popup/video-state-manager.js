class VideoStateManager {
    constructor(settings, channel) {
        this.settings = settings;
        this.channel = channel;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.SYNC_INTERVAL_MS = 1000;
    }
    async saveTimestamp(currentTime, callback) {
        try {
            const db = await VirtualCameraDB.open();
            const transaction = db.transaction(['state', 'hashes'], 'readwrite');
            const store = transaction.objectStore('state');
            const hashStore = transaction.objectStore('hashes');
            const timestampData = {
                currentTime,
                savedAt: Date.now(),
                videoHash: null
            };
            const hashRequest = hashStore.get('videoHash');
            hashRequest.onsuccess = (event) => {
                timestampData.videoHash = event.target.result;
                store.put(timestampData, 'videoTimestamp');
            };
            transaction.oncomplete = () => { if (callback) callback(); };
        } catch {}
    }
    async loadTimestamp(videoElement, callback) {
        try {
            const db = await VirtualCameraDB.open();
            const transaction = db.transaction(['state', 'hashes'], 'readonly');
            const timestampStore = transaction.objectStore('state');
            const hashStore = transaction.objectStore('hashes');
            const [timestampData, currentHash] = await Promise.all([
                new Promise(resolve => {
                    const req = timestampStore.get('videoTimestamp');
                    req.onsuccess = e => resolve(e.target.result);
                    req.onerror = () => resolve(null);
                }),
                new Promise(resolve => {
                    const req = hashStore.get('videoHash');
                    req.onsuccess = e => resolve(e.target.result);
                    req.onerror = () => resolve(null);
                })
            ]);
            if (!timestampData || !currentHash) return callback && callback(null);
            if (timestampData.videoHash !== currentHash) return callback && callback(null);
            const timeSinceSave = (Date.now() - timestampData.savedAt) / 1000;
            let adjustedTime = timestampData.currentTime + timeSinceSave;
            if (this.settings.loop && videoElement && videoElement.duration) {
                adjustedTime = adjustedTime % videoElement.duration;
            }
            callback && callback({
                currentTime: adjustedTime,
                savedAt: timestampData.savedAt,
                timeSinceSave
            });
        } catch { callback && callback(null); }
    }
    async clearTimestamp() {
        try {
            const db = await VirtualCameraDB.open();
            db.transaction(['state'], 'readwrite').objectStore('state').delete('videoTimestamp');
        } catch {}
    }
    autoSaveTimestamp(videoElement) {
        if (!videoElement || !videoElement.src) return;
        if (!videoElement.paused && videoElement.currentTime > 0) {
            this.saveTimestamp(videoElement.currentTime);
        }
    }
    startSync(videoElement) {
        if (this.syncInterval) return;
        this.syncInterval = setInterval(() => {
            if (videoElement && !videoElement.paused) {
                const currentTime = videoElement.currentTime;
                const elapsed = Date.now() - this.lastSyncTime;
                if (elapsed >= this.SYNC_INTERVAL_MS) {
                    this.channel.postMessage({ 
                        type: 'VIRTUAL_CAMERA_CONTROL', 
                        command: 'sync', 
                        time: currentTime 
                    });
                    this.lastSyncTime = Date.now();
                }
                if (Math.floor(currentTime) % 10 === 0) {
                    this.autoSaveTimestamp(videoElement);
                }
            }
        }, this.SYNC_INTERVAL_MS);
    }
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            this.lastSyncTime = 0;
        }
    }
}
window.VideoStateManager = VideoStateManager;