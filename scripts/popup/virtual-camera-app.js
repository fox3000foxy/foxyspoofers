class VirtualCameraApp {
    constructor() {
        this.settings = {
            loop: true,
            autoplay: true,
            mute: true,
            volume: 0.5,
            playbackRate: 1.0
        };
        this.channel = new BroadcastChannel('virtual_camera_channel');
        this.stateManager = new VideoStateManager(this.settings, this.channel);
        this.videoStorage = new VideoStorage(this.settings, this.stateManager, Toast.show);
        this.isOn = false;
        this.userPaused = false;
        this.init();
    }
    init() {
        this.setupTabs();
        this.setupUIRefs();
        this.setupDragAndDrop();
        this.setupVideoEvents();
        this.setupUpload();
        this.setupClearDb();
        this.setupToggle();
        this.loadInitialState();
        this.settingsUI = new SettingsUI(this.refreshAllStatusIndicators.bind(this));
        setTimeout(() => { document.body.classList.add('fade-in'); }, 100);
        window.addEventListener('beforeunload', this.handleUnload.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    setupUIRefs() {
        this.toggleButton = document.getElementById('toggle-button');
        this.videoElement = document.getElementById('video');
        this.videoUpload = document.getElementById('video-upload');
        this.clearDbBtn = document.getElementById('clear-db-btn');
        this.videoOverlay = document.getElementById('video-overlay'); // Ajout
    }
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                tabButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                tabContents.forEach(tab => tab.style.display = 'none');
                const tabId = 'tab-' + this.dataset.tab;
                const tabToShow = document.getElementById(tabId);
                if (tabToShow) tabToShow.style.display = 'flex';
            });
        });
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tab => {
            if (tab.classList.contains('active')) {
            tab.style.display = '';
            } else {
            tab.style.display = 'none';
            }
        });
        const defaultBtn = document.querySelector('.tab-btn[data-tab="camera"]');
        const defaultTab = document.getElementById('tab-camera');
        if (defaultBtn) defaultBtn.classList.add('active');
        if (defaultTab) defaultTab.style.display = '';
    }
    setupDragAndDrop() {
        const videoSection = document.querySelector('.video-section');
        if (!videoSection) return;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            videoSection.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            videoSection.addEventListener(eventName, () => {
                videoSection.style.boxShadow = '0 0 20px rgba(102,126,234,0.5)';
                videoSection.style.transform = 'scale(1.02)';
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            videoSection.addEventListener(eventName, () => {
                videoSection.style.boxShadow = '';
                videoSection.style.transform = '';
            }, false);
        });
        videoSection.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.videoStorage.saveVideo(files[0], this.videoElement, () => {
                    this.toggleButton.disabled = false;
                    this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'sourceChanged' });
                });
            }
        }, false);
    }
    setupVideoEvents() {
        if (!this.videoElement) return;
        this.videoElement.addEventListener('loadedmetadata', () => {
            this.applyVideoSettings();
            this.updateVideoOverlay(); // Ajout
        });
        this.videoElement.addEventListener('emptied', () => {
            this.stateManager.stopSync();
            this.updateVideoOverlay(); // Ajout
        });
        this.videoElement.addEventListener('timeupdate', () => {
            if (!this.videoElement.paused && Math.floor(this.videoElement.currentTime) % 5 === 0) {
                this.stateManager.autoSaveTimestamp(this.videoElement);
            }
        });
        this.videoElement.addEventListener('seeked', () => {
            this.stateManager.saveTimestamp(this.videoElement.currentTime);
            this.channel.postMessage({ 
                type: 'VIRTUAL_CAMERA_CONTROL', 
                command: 'seek', 
                time: this.videoElement.currentTime 
            });
            this.stateManager.lastSyncTime = Date.now();
        });
        this.videoElement.addEventListener('pause', () => {
            this.stateManager.saveTimestamp(this.videoElement.currentTime);
            if(!this.userPaused) return;
            this.videoElement.play();
        });
        this.videoElement.addEventListener('click', () => {
            if (!this.videoElement.paused) {
                this.userPaused = false;
                this.videoElement.play();
                this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'pause' });
                this.stateManager.stopSync();
            } else {
                this.userPaused = true;
                this.videoElement.pause();
                this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'play' });
                this.stateManager.startSync(this.videoElement);
            }
        });
        this.videoElement.addEventListener('canplay', () => {
            if (this.isOn) this.stateManager.startSync(this.videoElement);
        });
        this.videoElement.addEventListener('emptied', () => {
            this.stateManager.stopSync();
        });
    }
    setupUpload() {
        if (this.videoUpload) {
            this.videoUpload.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.videoStorage.saveVideo(file, this.videoElement, () => {
                        this.toggleButton.disabled = false;
                        this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'sourceChanged' });
                    });
                }
            });
        }
        const fileWrapper = document.querySelector('#video-upload-btn');
        if (fileWrapper && this.videoUpload) {
            fileWrapper.addEventListener('click', () => {
                this.videoUpload.click();
            });
        }
    }
    setupClearDb() {
        if (this.clearDbBtn) {
            this.clearDbBtn.onclick = async () => {
                if (!confirm('Are you sure you want to erase all data?')) return;
                try {
                    const db = await VirtualCameraDB.open();
                    const transaction = db.transaction(['videos', 'hashes', 'state'], 'readwrite');
                    transaction.objectStore('videos').clear();
                    transaction.objectStore('hashes').clear();
                    transaction.objectStore('state').clear();
                    transaction.oncomplete = () => {
                        Toast.show('All data has been erased', 'success');
                        setTimeout(() => { location.reload(); }, 1000);
                    };
                } catch {
                    Toast.show('Error while erasing', 'error');
                }
            };
        }
    }
    setupToggle() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                if (!this.videoElement.src) {
                    Toast.show('Please load a video first', 'error');
                    return;
                }
                this.isOn = !this.isOn;
                this.setVirtualCameraState(this.isOn);
                if (this.isOn) {
                    this.stateManager.loadTimestamp(this.videoElement, (timestampData) => {
                        if (timestampData && timestampData.currentTime > 0) {
                            this.videoElement.currentTime = Math.min(timestampData.currentTime, this.videoElement.duration);
                        }
                        this.videoElement.play();
                        this.stateManager.startSync(this.videoElement);
                    });
                    this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'turnOn' });
                    Toast.show('Virtual camera enabled', 'success');
                } else {
                    this.stateManager.saveTimestamp(this.videoElement.currentTime);
                    this.videoElement.pause();
                    this.videoElement.currentTime = 0;
                    this.stateManager.clearTimestamp();
                    this.stateManager.stopSync();
                    this.channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'turnOff' });
                    Toast.show('Virtual camera disabled', 'info');
                }
            });
        }
    }
    updateVideoOverlay() {
        if (!this.videoOverlay) return;
        if (this.videoElement && this.videoElement.src && this.videoElement.duration > 0) {
            this.videoOverlay.style.display = 'none';
        } else {
            this.videoOverlay.style.display = '';
        }
    }
    loadInitialState() {
        this.videoStorage.loadVideo(this.videoElement, (hasVideo) => {
            this.loadVirtualCameraState((state) => {
                this.isOn = !!state;
                this.setVirtualCameraState(this.isOn);
                if (!hasVideo) {
                    this.toggleButton.disabled = true;
                }
                this.updateVideoOverlay(); // Ajout
            });
        });
    }
    setVirtualCameraState(isOn) {
        this.saveVirtualCameraState(isOn, () => {
            this.updateToggleButton(isOn);
            this.refreshAllStatusIndicators();
        });
    }
    saveVirtualCameraState(isOn, callback) {
        VirtualCameraDB.open().then(db => {
            const transaction = db.transaction(['state'], 'readwrite');
            transaction.objectStore('state').put(isOn, 'virtualCameraOn');
            transaction.oncomplete = () => callback && callback();
        });
    }
    loadVirtualCameraState(callback) {
        VirtualCameraDB.open().then(db => {
            const transaction = db.transaction(['state'], 'readonly');
            const store = transaction.objectStore('state');
            const request = store.get('virtualCameraOn');
            request.onsuccess = function(event) { callback(!!event.target.result); };
            request.onerror = function() { callback(false); };
        });
    }
    updateToggleButton(isOn) {
        const span = this.toggleButton.querySelector('span');
        const text = this.toggleButton.childNodes[this.toggleButton.childNodes.length - 1];
        if (isOn) {
            this.toggleButton.classList.add('active');
            if (span) span.textContent = '⏹️';
            if (text) text.textContent = ' Disable camera';
        } else {
            this.toggleButton.classList.remove('active');
            if (span) span.textContent = '▶️';
            if (text) text.textContent = ' Enable camera';
        }
    }
    applyVideoSettings() {
        if (!this.videoElement) return;
        this.videoElement.loop = this.settings.loop;
        this.videoElement.muted = this.settings.mute;
        this.videoElement.volume = this.settings.mute ? 0 : this.settings.volume;
        if (this.settings.autoplay && this.videoElement.src && this.videoElement.paused) {
            this.videoElement.play().catch(() => {});
        }
    }
    refreshAllStatusIndicators() {
        this.loadVirtualCameraState((cameraOn) => {
            chrome.storage.local.get('geoSpoof', (data) => {
                const geoVal = data.geoSpoof || {};
                const geoOn = !!geoVal.enabled;
                chrome.storage.local.get(['proxySettings', 'uaSettings'], (data2) => {
                    const proxyVal = data2.proxySettings || {};
                    const proxyOn = !!proxyVal.enabled;
                    const uaVal = data2.uaSettings || {};
                    const uaOn = !!uaVal.enabled && !!uaVal.ua;

                    // Camera
                    const dotCamera = document.getElementById('status-dot-camera');
                    dotCamera.style.background = cameraOn ? '#10b981' : '#ef4444';

                    // Geolocation
                    const dotGeo = document.getElementById('status-dot-geo');
                    dotGeo.style.background = geoOn ? '#10b981' : '#ef4444';

                    // Proxy
                    const dotProxy = document.getElementById('status-dot-proxy');
                    dotProxy.style.background = proxyOn ? '#10b981' : '#ef4444';

                    // User-Agent
                    const dotUA = document.getElementById('status-dot-browser');
                    if (dotUA) dotUA.style.background = uaOn ? '#10b981' : '#ef4444';
                });
            });
        });
    }
    handleUnload() {
        if (this.videoElement && this.videoElement.src && this.videoElement.currentTime > 0) {
            this.stateManager.saveTimestamp(this.videoElement.currentTime);
        }
        this.stateManager.stopSync();
        if (this.videoElement && this.videoElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.videoElement.src);
        }
    }
    handleVisibilityChange() {
        if (document.hidden && this.videoElement && this.videoElement.currentTime > 0) {
            this.stateManager.saveTimestamp(this.videoElement.currentTime);
        }
    }
}
window.VirtualCameraApp = VirtualCameraApp;