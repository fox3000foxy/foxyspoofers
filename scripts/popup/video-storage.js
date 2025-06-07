class VideoStorage {
    constructor(settings, stateManager, notificationCb) {
        this.settings = settings;
        this.stateManager = stateManager;
        this.notify = notificationCb;
    }
    async computeHash(buffer) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async saveVideo(file, videoElement, callback) {
        if (!file.type.startsWith('video/')) {
            this.notify('Please select a video file', 'error');
            return;
        }
        this.notify('Loading...', 'info');
        try {
            const db = await VirtualCameraDB.open();
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const buffer = e.target.result;
                    const hash = await this.computeHash(buffer);
                    const transaction = db.transaction(['videos', 'hashes'], 'readwrite');
                    transaction.objectStore('videos').put(buffer, 'video');
                    transaction.objectStore('hashes').put(hash, 'videoHash');
                    transaction.oncomplete = () => {
                        const blob = new Blob([buffer], { type: file.type });
                        videoElement.src = URL.createObjectURL(blob);
                        videoElement.muted = this.settings.mute;
                        videoElement.volume = this.settings.mute ? 0 : this.settings.volume;
                        videoElement.loop = this.settings.loop;
                        this.notify('Video loaded successfully', 'success');
                        if (callback) callback();
                    };
                } catch {
                    this.notify('Error while loading', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } catch {
            this.notify('Error while loading', 'error');
        }
    }
    async loadVideo(videoElement, callback) {
        try {
            const db = await VirtualCameraDB.open();
            const transaction = db.transaction(['videos'], 'readonly');
            const store = transaction.objectStore('videos');
            const request = store.get('video');
            request.onsuccess = (event) => {
                if (event.target.result) {
                    const blob = new Blob([event.target.result]);
                    videoElement.src = URL.createObjectURL(blob);
                    videoElement.muted = this.settings.mute;
                    videoElement.volume = this.settings.mute ? 0 : this.settings.volume;
                    videoElement.loop = this.settings.loop;
                    videoElement.addEventListener('loadedmetadata', () => {
                        this.stateManager.loadTimestamp(videoElement, (timestampData) => {
                            if (timestampData && timestampData.currentTime > 0) {
                                const targetTime = Math.min(timestampData.currentTime, videoElement.duration);
                                videoElement.currentTime = targetTime;
                                this.notify(
                                    `Video resumed at ${Math.round(targetTime)}s`, 
                                    'info'
                                );
                            }
                        });
                    }, { once: true });
                    if (callback) callback(true);
                } else {
                    if (callback) callback(false);
                }
            };
            request.onerror = function() { if (callback) callback(false); };
        } catch { if (callback) callback(false); }
    }
}
window.VideoStorage = VideoStorage;