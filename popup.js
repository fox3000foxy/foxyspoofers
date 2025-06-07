console.log('Hello from content script!');

// Preloader screen
const preloader = document.createElement('div');
preloader.id = 'preloader';
preloader.innerHTML = `
    <div class="preloader-spinner"></div>
    <div class="preloader-text">Loading Virtual Camera...</div>
`;
Object.assign(preloader.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #23293a 0, #374151 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
});
const style = document.createElement('style');
style.textContent = `
#preloader .preloader-spinner {
        width: 56px;
        height: 56px;
        border: 6px solid #667eea;
        border-top: 6px solid #a5b4fc;
        border-radius: 50%;
        animation: preloader-spin 1s linear infinite;
        margin-bottom: 24px;
}
#preloader .preloader-text {
        color: #fff;
        font-size: 1.2em;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-shadow: 0 2px 8px rgba(30,41,59,0.2);
}
@keyframes preloader-spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
}
`;
document.head.appendChild(style);
document.body.appendChild(preloader);

fetch(chrome.runtime.getURL('popup/popup.html'))
    .then(response => response.text())
    .then(html => {
        fetch(chrome.runtime.getURL('popup/popup.css'))
            .then(cssResponse => cssResponse.text())
            .then(css => {
                // Inject CSS into the document
                const style = document.createElement('style');
                style.textContent = css;
                document.head.appendChild(style);
            })
            .catch(err => console.error('Error loading CSS:', err));
        document.documentElement.innerHTML = html.replace('${domain}', window.location.hostname);
        console.log('Injecting script');
        executeScript();
    });

function executeScript() {
    console.log('Executing script');

    // Global settings variables
    let settings = {
        loop: true,
        autoplay: true,
        mute: true,
        volume: 0.5,
        playbackRate: 1.0
    };

    // Synchronization system
    let syncInterval = null;
    let lastSyncTime = 0;
    const SYNC_INTERVAL_MS = 1000;

    // Timestamp persistence functions
    function saveVideoTimestamp(currentTime, callback) {
        openDB().then(db => {
            // Open a transaction including both 'state' and 'hashes'
            const transaction = db.transaction(['state', 'hashes'], 'readwrite');
            const store = transaction.objectStore('state');
            const hashStore = transaction.objectStore('hashes');

            const timestampData = {
                currentTime: currentTime,
                savedAt: Date.now(),
                videoHash: null // Will be updated with the current video hash
            };

            // Get the current video hash in the same transaction
            const hashRequest = hashStore.get('videoHash');

            hashRequest.onsuccess = (event) => {
                timestampData.videoHash = event.target.result;
                store.put(timestampData, 'videoTimestamp');
            };

            transaction.oncomplete = () => {
                console.log(`[VirtualCamera] Timestamp saved: ${currentTime}s`);
                callback && callback();
            };
            transaction.onerror = (event) => {
                console.warn('[VirtualCamera] Timestamp save transaction error:', event.target.error);
            };
        }).catch(error => {
            console.warn('[VirtualCamera] Timestamp save error:', error);
        });
    }

    function loadVideoTimestamp(callback) {
        openDB().then(db => {
            const transaction = db.transaction(['state', 'hashes'], 'readonly');
            const timestampStore = transaction.objectStore('state');
            const hashStore = transaction.objectStore('hashes');
            
            const timestampRequest = timestampStore.get('videoTimestamp');
            const currentHashRequest = hashStore.get('videoHash');
            
            Promise.all([
                new Promise(resolve => {
                    timestampRequest.onsuccess = (event) => resolve(event.target.result);
                    timestampRequest.onerror = () => resolve(null);
                }),
                new Promise(resolve => {
                    currentHashRequest.onsuccess = (event) => resolve(event.target.result);
                    currentHashRequest.onerror = () => resolve(null);
                })
            ]).then(([timestampData, currentHash]) => {
                if (!timestampData || !currentHash) {
                    callback && callback(null);
                    return;
                }

                // Check if the timestamp matches the same video
                if (timestampData.videoHash !== currentHash) {
                    console.log('[VirtualCamera] Different hash, timestamp ignored');
                    callback && callback(null);
                    return;
                }

                // Calculate elapsed time since save if the video was playing
                const timeSinceSave = (Date.now() - timestampData.savedAt) / 1000;
                let adjustedTime = timestampData.currentTime;

                // If less than 5 minutes have passed, estimate progression
                // if (timeSinceSave < 300) { // 5 minutes
                    // If loop is enabled, adjust time with modulo to stay within duration
                    adjustedTime += timeSinceSave;
                    if (settings.loop && videoElement && videoElement.duration) {
                        adjustedTime = adjustedTime % videoElement.duration;
                    }
                    console.log(`[VirtualCamera] Estimated time after ${timeSinceSave.toFixed(1)}s: ${adjustedTime.toFixed(1)}s`);
                // }

                callback && callback({
                    currentTime: adjustedTime,
                    savedAt: timestampData.savedAt,
                    timeSinceSave: timeSinceSave
                });
            });
        }).catch(error => {
            console.warn('[VirtualCamera] Timestamp load error:', error);
            callback && callback(null);
        });
    }

    function clearVideoTimestamp() {
        openDB().then(db => {
            const transaction = db.transaction(['state'], 'readwrite');
            transaction.objectStore('state').delete('videoTimestamp');
        }).catch(console.warn);
    }

    // Automatic periodic sync function
    function autoSaveTimestamp(videoElement) {
        if (!videoElement || !videoElement.src) return;
        
        // Auto-save every 10 seconds if the video is playing
        if (!videoElement.paused && videoElement.currentTime > 0) {
            saveVideoTimestamp(videoElement.currentTime);
        }
    }

    function startVideoSync(videoElement) {
        if (syncInterval) return;
        
        syncInterval = setInterval(() => {
            if (videoElement && !videoElement.paused) {
                const currentTime = videoElement.currentTime;
                const elapsed = Date.now() - lastSyncTime;
                
                if (elapsed >= SYNC_INTERVAL_MS) {
                    channel.postMessage({ 
                        type: 'VIRTUAL_CAMERA_CONTROL', 
                        command: 'sync', 
                        time: currentTime 
                    });
                    lastSyncTime = Date.now();
                }
                
                // Auto-save every 10 seconds
                if (Math.floor(currentTime) % 10 === 0) {
                    autoSaveTimestamp(videoElement);
                }
            }
        }, SYNC_INTERVAL_MS);
    }

    function stopVideoSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            lastSyncTime = 0;
        }
    }

    // --- Improved IndexedDB helpers ---
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('virtualCameraDB', 2); // Increased version
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos');
                if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
                if (!db.objectStoreNames.contains('hashes')) db.createObjectStore('hashes');
                // if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings'); // New
            };
            request.onsuccess = function(event) { resolve(event.target.result); };
            request.onerror = function(event) { reject(event.target.error); };
        });
    }

    function saveVideoToIndexedDB(file, videoElement, callback) {
        // Improved file validation
        if (!file.type.startsWith('video/')) {
            showNotification('Please select a video file', 'error');
            return;
        }

        // const maxSize = 50 * 1024 * 1024; // 50MB
        // if (file.size > maxSize) {
        //     showNotification('File too large (max 50MB)', 'error');
        //     return;
        // }

        showLoading(true);
        
        openDB().then(async db => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const buffer = e.target.result;
                    const hash = await computeHash(buffer);
                    const transaction = db.transaction(['videos', 'hashes'], 'readwrite');
                    transaction.objectStore('videos').put(buffer, 'video');
                    transaction.objectStore('hashes').put(hash, 'videoHash');
                    transaction.oncomplete = () => {
                        const blob = new Blob([buffer], { type: file.type });
                        videoElement.src = URL.createObjectURL(blob);
                        videoElement.muted = settings.mute;
                        videoElement.volume = settings.mute ? 0 : settings.volume;
                        videoElement.loop = settings.loop;
                        hideVideoOverlay();
                        showNotification('Video loaded successfully', 'success');
                        showLoading(false);
                        callback && callback();
                    };
                } catch (error) {
                    console.warn('Error while saving:', error);
                    showNotification('Error while loading', 'error');
                    showLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function loadVideoFromIndexedDB(videoElement, callback) {
        openDB().then(db => {
            const transaction = db.transaction(['videos'], 'readonly');
            const store = transaction.objectStore('videos');
            const request = store.get('video');
            
            request.onsuccess = function(event) {
                if (event.target.result) {
                    const blob = new Blob([event.target.result]);
                    videoElement.src = URL.createObjectURL(blob);
                    videoElement.muted = settings.mute;
                    videoElement.volume = settings.mute ? 0 : settings.volume;
                    videoElement.loop = settings.loop;
                    
                    // Load saved timestamp
                    videoElement.addEventListener('loadedmetadata', () => {
                        loadVideoTimestamp((timestampData) => {
                            if (timestampData && timestampData.currentTime > 0) {
                                const targetTime = Math.min(timestampData.currentTime, videoElement.duration);
                                videoElement.currentTime = targetTime;
                                
                                const timeInfo = timestampData.timeSinceSave < 60 
                                    ? `${Math.round(timestampData.timeSinceSave)}s ago`
                                    : `${Math.round(timestampData.timeSinceSave / 60)}min ago`;
                                
                                showNotification(
                                    `Video resumed at ${Math.round(targetTime)}s (saved ${timeInfo})`, 
                                    'info'
                                );
                            }
                        });
                    }, { once: true });
                    
                    hideVideoOverlay();
                    callback && callback(true);
                } else {
                    showVideoOverlay();
                    callback && callback(false);
                }
            };
            request.onerror = function() { callback && callback(false); };
        });
    }

    function saveVirtualCameraState(isOn, callback) {
        openDB().then(db => {
            const transaction = db.transaction(['state'], 'readwrite');
            transaction.objectStore('state').put(isOn, 'virtualCameraOn');
            transaction.oncomplete = () => callback && callback();
        });
    }

    function loadVirtualCameraState(callback) {
        openDB().then(db => {
            const transaction = db.transaction(['state'], 'readonly');
            const store = transaction.objectStore('state');
            const request = store.get('virtualCameraOn');
            request.onsuccess = function(event) { callback(!!event.target.result); };
            request.onerror = function() { callback(false); };
        });
    }

    function updateToggleButton(toggleButton, isOn) {
        const span = toggleButton.querySelector('span');
        const text = toggleButton.childNodes[toggleButton.childNodes.length - 1];
        
        if (isOn) {
            toggleButton.classList.add('active');
            if (span) span.textContent = '⏹️';
            if (text) text.textContent = ' Disable camera';
        } else {
            toggleButton.classList.remove('active');
            if (span) span.textContent = '▶️';
            if (text) text.textContent = ' Enable camera';
        }
    }

    function updateStatusIndicator(active) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statusDot) {
            statusDot.classList.toggle('active', active);
        }
        if (statusText) {
            statusText.textContent = active ? 'Active' : 'Inactive';
        }
    }

    function updateStatusIndicatorMulti({ camera, geo, proxy }) {
        // Camera
        const dotCamera = document.getElementById('status-dot-camera');
        const textCamera = document.getElementById('status-text-camera');
        if (dotCamera) dotCamera.classList.toggle('active', camera);
        if (textCamera) textCamera.textContent = camera ? 'Virtual Camera (On)' : 'Virtual Camera (Off)';

        // Geolocation
        const dotGeo = document.getElementById('status-dot-geo');
        const textGeo = document.getElementById('status-text-geo');
        if (dotGeo) dotGeo.classList.toggle('active', geo);
        if (textGeo) textGeo.textContent = geo ? 'Geolocation Spoof (On)' : 'Geolocation Spoof (Off)';

        // Proxy
        const dotProxy = document.getElementById('status-dot-proxy');
        const textProxy = document.getElementById('status-text-proxy');
        if (dotProxy) dotProxy.classList.toggle('active', proxy);
        if (textProxy) textProxy.textContent = proxy ? 'Proxy (On)' : 'Proxy (Off)';
    }

    // Synchronize and update status indicators
    // Appelle cette fonction à chaque changement d’état
    function refreshAllStatusIndicators() {
        // Virtual Camera
        loadVirtualCameraState((cameraOn) => {
            // Geolocation
            openDB().then(db => {
                db.transaction(['state'], 'readonly').objectStore('state').get('geoSpoof').onsuccess = e => {
                    const geoVal = e.target.result;
                    const geoOn = geoVal && geoVal.enabled;

                    // Proxy
                    chrome.storage.local.get('proxySettings', (data) => {
                        const proxyVal = data.proxySettings || {};
                        const proxyOn = !!proxyVal.enabled;

                        updateStatusIndicatorMulti({
                            camera: !!cameraOn,
                            geo: !!geoOn,
                            proxy: !!proxyOn
                        });
                    });
                };
            });
        });
    }

    async function computeHash(buffer) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // UI functions
    function hideVideoOverlay() {
        const overlay = document.getElementById('video-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    function showVideoOverlay() {
        const overlay = document.getElementById('video-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    function showNotification(message, type = 'info') {
        console.log(`[VirtualCamera] ${type.toUpperCase()}: ${message}`);
        createToast(message, type);
    }

    function createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: type === 'success' ? '#10b981' : 
                           type === 'error' ? '#ef4444' : '#667eea',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    function showLoading(show) {
        const toggleButton = document.getElementById('toggle-button');
        if (toggleButton) {
            toggleButton.disabled = show;
            toggleButton.style.opacity = show ? '0.6' : '1';
        }
    }

    // Toggle switch handler
    function setupToggleSwitch(elementId, settingName) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.classList.toggle('active', settings[settingName]);
        
        element.addEventListener('click', () => {
            settings[settingName] = !settings[settingName];
            element.classList.toggle('active', settings[settingName]);
            applyVideoSettings();
            
            const displayName = {
                loop: 'Loop playback',
                autoplay: 'Autoplay',
                mute: 'Mute'
            }[settingName] || settingName;
            
            showNotification(`${displayName} ${settings[settingName] ? 'enabled' : 'disabled'}`, 'info');
        });
    }

    function applyVideoSettings() {
        const videoElement = document.getElementById('video');
        if (!videoElement) return;

        videoElement.loop = settings.loop;
        videoElement.muted = settings.mute;
        videoElement.volume = settings.mute ? 0 : settings.volume;
        
        if (settings.autoplay && videoElement.src && videoElement.paused) {
            videoElement.play().catch(console.warn);
        }
    }

    // Drag & Drop setup
    function setupDragAndDrop() {
        const videoSection = document.querySelector('.video-section');
        if (!videoSection) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            videoSection.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            videoSection.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            videoSection.addEventListener(eventName, unhighlight, false);
        });

        videoSection.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight() {
            videoSection.style.boxShadow = '0 0 20px rgba(102,126,234,0.5)';
            videoSection.style.transform = 'scale(1.02)';
        }

        function unhighlight() {
            videoSection.style.boxShadow = '';
            videoSection.style.transform = '';
        }

        function handleDrop(e) {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const videoElement = document.getElementById('video');
                const toggleButton = document.getElementById('toggle-button');
                saveVideoToIndexedDB(files[0], videoElement, () => {
                    toggleButton.disabled = false;
                    channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'sourceChanged' });
                });
            }
        }
    }

    // --- Improved UI Logic ---
    const toggleButton = document.getElementById('toggle-button');
    const videoElement = document.getElementById('video');
    const videoUpload = document.getElementById('video-upload');
    const clearDbBtn = document.getElementById('clear-db-btn');
    const channel = new BroadcastChannel('virtual_camera_channel');
    let isOn = false;
    let userPaused = false;

    // Setup Drag & Drop
    setupDragAndDrop();

    // Improved video controls
    if (videoElement) {
        videoElement.addEventListener('loadedmetadata', () => {
            console.log(`[VirtualCamera] Video: ${videoElement.videoWidth}x${videoElement.videoHeight}, duration: ${videoElement.duration}s`);
            applyVideoSettings();
        });

        // Periodic save during playback
        videoElement.addEventListener('timeupdate', () => {
            // Save every 5 seconds during playback
            if (!videoElement.paused && Math.floor(videoElement.currentTime) % 5 === 0) {
                autoSaveTimestamp(videoElement);
            }
        });

        // Save on manual seek
        videoElement.addEventListener('seeked', () => {
            saveVideoTimestamp(videoElement.currentTime);
            channel.postMessage({ 
                type: 'VIRTUAL_CAMERA_CONTROL', 
                command: 'seek', 
                time: videoElement.currentTime 
            });
            lastSyncTime = Date.now();
        });

        // Save on pause
        videoElement.addEventListener('pause', () => {
            saveVideoTimestamp(videoElement.currentTime);
            if(!userPaused) return;
            videoElement.play();
        });

        videoElement.addEventListener('click', () => {
            if (!videoElement.paused) {
                userPaused = false;
                videoElement.play();
                channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'pause' });
                stopVideoSync();
            } else {
                userPaused = true;
                videoElement.pause();
                channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'play' });
                startVideoSync(videoElement);
            }
        });

        // Can play starts sync
        videoElement.addEventListener('canplay', () => {
            if (isOn) {
                startVideoSync(videoElement);
            }
        });

        // Manual seek sync
        videoElement.addEventListener('seeked', () => {
            channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'seek', time: videoElement.currentTime });
            lastSyncTime = Date.now(); // Avoid double sync
        });

        // Cleanup on source change
        videoElement.addEventListener('emptied', () => {
            stopVideoSync();
        });
    }

    // Improved video upload
    if (videoUpload) {
        videoUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                saveVideoToIndexedDB(file, videoElement, () => {
                    toggleButton.disabled = false;
                    channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'sourceChanged' });
                });
            }
        });
    }

    // Custom file button
    const fileWrapper = document.querySelector('#video-upload-btn');
    if (fileWrapper && videoUpload) {
        fileWrapper.addEventListener('click', () => {
            videoUpload.click();
        });
    }

    // Initialization
    loadVideoFromIndexedDB(videoElement, (hasVideo) => {
        loadVirtualCameraState((state) => {
            isOn = !!state;
            setVirtualCameraState(isOn, videoElement, toggleButton);
            if (!hasVideo) {
                toggleButton.disabled = true;
                showVideoOverlay();
            } else {
                hideVideoOverlay();
            }
        });
    });

    // Improved toggle button
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            if (!videoElement.src) {
                showNotification('Please load a video first', 'error');
                return;
            }
            isOn = !isOn;
            setVirtualCameraState(isOn, videoElement, toggleButton);

            if (isOn) {
                // Resume at saved position if available
                loadVideoTimestamp((timestampData) => {
                    if (timestampData && timestampData.currentTime > 0) {
                        videoElement.currentTime = Math.min(timestampData.currentTime, videoElement.duration);
                    }
                    videoElement.play();
                    startVideoSync(videoElement);
                });
                
                channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'turnOn' });
                showNotification('Virtual camera enabled', 'success');
            } else {
                saveVideoTimestamp(videoElement.currentTime); // Save before stopping
                videoElement.pause();
                videoElement.currentTime = 0;
                clearVideoTimestamp(); // Clear timestamp as we reset to zero
                stopVideoSync();
                channel.postMessage({ type: 'VIRTUAL_CAMERA_CONTROL', command: 'turnOff' });
                showNotification('Virtual camera disabled', 'info');
            }
        });
    }

    // Improved Clear IndexedDB
    if (clearDbBtn) {
        clearDbBtn.onclick = async () => {
            if (!confirm('Are you sure you want to erase all data?')) {
                return;
            }

            try {
                showLoading(true);
                const db = await openDB();
                
                // Clear all stores
                const transaction = db.transaction(['videos', 'hashes', 'state'], 'readwrite');
                transaction.objectStore('videos').clear();
                transaction.objectStore('hashes').clear();
                transaction.objectStore('state').clear(); // Includes timestamps
                
                transaction.oncomplete = () => {
                    showNotification('All data has been erased', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                };
            } catch (error) {
                console.warn('Error while erasing:', error);
                showNotification('Error while erasing', 'error');
                showLoading(false);
            }
        };
    }

    // Entry animation
    setTimeout(() => {
        document.body.classList.add('fade-in');
    }, 100);

    // Gestion des onglets popup
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                tabButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                tabContents.forEach(tab => tab.style.display = 'none');
                const tabId = 'tab-' + this.dataset.tab;
                const tabToShow = document.getElementById(tabId);
                if (tabToShow) tabToShow.style.display = '';
            });
        });
        // Affiche l'onglet Virtual Camera par défaut
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(tab => tab.style.display = 'none');
        const defaultBtn = document.querySelector('.tab-btn[data-tab="virtual-camera"]');
        const defaultTab = document.getElementById('tab-virtual-camera');
        if (defaultBtn) defaultBtn.classList.add('active');
        if (defaultTab) defaultTab.style.display = '';
    }
    setupTabs();

    // Cleanup on close - CRITICAL SAVE
    window.addEventListener('beforeunload', () => {
        console.log('[VirtualCamera] Saving before closing...');
        
        // Synchronous timestamp save if a video is playing
        if (videoElement && videoElement.src && videoElement.currentTime > 0) {
            saveVideoTimestamp(videoElement.currentTime, () => {
                console.log('[VirtualCamera] Timestamp saved before closing');
            });
        }
        
        stopVideoSync();
        
        if (videoElement && videoElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoElement.src);
        }
    });

    // Additional save on visibilitychange (tab hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && videoElement && videoElement.currentTime > 0) {
            saveVideoTimestamp(videoElement.currentTime);
            console.log('[VirtualCamera] Timestamp saved (tab hidden)');
        }
    });

        // --- Geolocation Spoof UI ---
    const geoForm = document.getElementById('geo-form');
    const geoLat = document.getElementById('geo-lat');
    const geoLon = document.getElementById('geo-lon');
    const geoEnable = document.getElementById('geo-enable');
    const geoStatus = document.getElementById('geo-status');

    // Charger les valeurs sauvegardées
    function loadGeoSettings() {
        openDB().then(db => {
            const store = db.transaction(['state'], 'readonly').objectStore('state');
            store.get('geoSpoof').onsuccess = e => {
                const val = e.target.result;
                if (val) {
                    geoLat.value = val.lat;
                    geoLon.value = val.lon;
                    geoEnable.classList.toggle('active', !!val.enabled);
                }
            };
        });
    }
    loadGeoSettings();

    // Sauvegarder les valeurs
    function saveGeoSettings(lat, lon, enabled) {
        openDB().then(db => {
            const transaction = db.transaction(['state'], 'readwrite');
            const store = transaction.objectStore('state');
            store.put({lat, lon, enabled}, 'geoSpoof');
            transaction.oncomplete = () => {
                refreshAllStatusIndicators();
            };
        });
    }

    // Sauvegarde automatique sur changement
    if (geoForm) {
        geoLat.addEventListener('input', () => {
            saveGeoSettings(Number(geoLat.value), Number(geoLon.value), geoEnable.classList.contains('active'));
            geoStatus.textContent = "Settings saved!";
            setTimeout(() => geoStatus.textContent = "", 2000);
        });
        geoLon.addEventListener('input', () => {
            saveGeoSettings(Number(geoLat.value), Number(geoLon.value), geoEnable.classList.contains('active'));
            geoStatus.textContent = "Settings saved!";
            setTimeout(() => geoStatus.textContent = "", 2000);
        });
        geoEnable.addEventListener('click', () => {
            geoEnable.classList.toggle('active');
            saveGeoSettings(Number(geoLat.value), Number(geoLon.value), geoEnable.classList.contains('active'));
            geoStatus.textContent = "Settings saved!";
            setTimeout(() => geoStatus.textContent = "", 2000);
        });
    }

    // --- Proxy Settings UI ---
    const proxyForm = document.getElementById('proxy-form');
    const proxyType = document.getElementById('proxy-type');
    const proxyHost = document.getElementById('proxy-host');
    const proxyPort = document.getElementById('proxy-port');
    const proxyEnable = document.getElementById('proxy-enable');
    const proxyStatus = document.getElementById('proxy-status');
    const proxyClearBtn = document.getElementById('proxy-clear-btn');

    // Charger les paramètres proxy sauvegardés
    function loadProxySettings() {
        chrome.storage.local.get('proxySettings', (data) => {
            const val = data.proxySettings || {};
            proxyType.value = val.type || 'http';
            proxyHost.value = val.host || '';
            proxyPort.value = val.port || '';
            proxyEnable.classList.toggle('active', !!val.enabled);
        });
    }
    loadProxySettings();

    // Sauvegarder les paramètres proxy
    function saveProxySettings(type, host, port, enabled) {
        chrome.storage.local.set({
            proxySettings: { type, host, port, enabled }
        }, () => {
            proxyStatus.textContent = "Proxy settings saved!";
            setTimeout(() => proxyStatus.textContent = "", 2000);
            refreshAllStatusIndicators();
        });
    }

    // Sauvegarde automatique sur changement
    if (proxyForm) {
        proxyType.addEventListener('change', () => {
            saveProxySettings(
                proxyType.value,
                proxyHost.value,
                proxyPort.value,
                proxyEnable.classList.contains('active')
            );
        });
        proxyHost.addEventListener('input', () => {
            saveProxySettings(
                proxyType.value,
                proxyHost.value,
                proxyPort.value,
                proxyEnable.classList.contains('active')
            );
        });
        proxyPort.addEventListener('input', () => {
            saveProxySettings(
                proxyType.value,
                proxyHost.value,
                proxyPort.value,
                proxyEnable.classList.contains('active')
            );
        });
        proxyEnable.addEventListener('click', () => {
            proxyEnable.classList.toggle('active');
            saveProxySettings(
                proxyType.value,
                proxyHost.value,
                proxyPort.value,
                proxyEnable.classList.contains('active')
            );
        });
    }

    if (proxyClearBtn) {
        proxyClearBtn.addEventListener('click', () => {
            chrome.storage.local.remove('proxySettings', () => {
                proxyType.value = 'http';
                proxyHost.value = '';
                proxyPort.value = '';
                proxyEnable.classList.remove('active');
                proxyStatus.textContent = "Proxy settings cleared!";
                setTimeout(() => proxyStatus.textContent = "", 2000);
                refreshAllStatusIndicators();
            });
        });
    }

    function setVirtualCameraState(isOn, videoElement, toggleButton) {
        saveVirtualCameraState(isOn, () => {
            updateToggleButton(toggleButton, isOn);
            refreshAllStatusIndicators();
            // Optionnel : tu peux ajouter d'autres actions ici si besoin
        });
    }
}