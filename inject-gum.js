(async function() {
    'use strict';
    
    // Évite l'injection multiple
    if (window.virtualCameraInjected) return;
    window.virtualCameraInjected = true;

    // Évite l'injection sur l'interface de la caméra virtuelle
    if (window.location.href.includes('virtual-camera-interface')) {
        console.log('[VirtualCamera] Interface détectée, injection annulée.');
        return;
    }

    // === Configuration ===
    const CONFIG = {
        DB_NAME: 'virtualCameraDB',
        DB_VERSION: 2,
        CANVAS_WIDTH: 640,
        CANVAS_HEIGHT: 480,
        FPS: 30,
        CHANNEL_NAME: 'virtual_camera_channel'
    };

    // === Database Manager ===
    class DatabaseManager {
        static async openDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    const stores = ['videos', 'state', 'hashes'];
                    stores.forEach(storeName => {
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
                console.error(`[VirtualCamera] Erreur lors de la lecture de ${storeName}:`, error);
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

    // === Virtual Video Manager ===
    class VirtualVideoManager {
        constructor() {
            this.videoElement = null;
            this.activeStreams = 0;
            this.drawHandlerAttached = false;
            this.currentVideoData = null;
            this.lastVideoHash = null;
        }

        async initialize() {
            this.currentVideoData = await DatabaseManager.getVideoBlob();
            this.lastVideoHash = await DatabaseManager.getVideoHash();
            
            if (!this.currentVideoData) {
                console.warn('[VirtualCamera] Aucune vidéo trouvée dans IndexedDB.');
            }
        }

        createVideoElement() {
            if (this.videoElement) return this.videoElement;

            const video = document.createElement('video');
            video.loop = true;
            video.muted = true;
            video.volume = 0;
            video.autoplay = true;
            video.playsInline = true;
            video.style.display = 'none';
            document.body.appendChild(video);

            this.videoElement = video;
            return video;
        }

        async reloadVideo() {
            this.currentVideoData = await DatabaseManager.getVideoBlob();
            if (!this.videoElement || !this.currentVideoData) return;

            this.videoElement.src = this.currentVideoData;
            this.videoElement.currentTime = 0;
            
            try {
                await this.videoElement.play();
            } catch (error) {
                console.warn('[VirtualCamera] Impossible de lancer la vidéo:', error);
            }
        }

        async checkForVideoUpdate() {
            const hash = await DatabaseManager.getVideoHash();
            if (hash !== this.lastVideoHash) {
                await this.reloadVideo();
                this.lastVideoHash = hash;
            }
        }

        async createVirtualStream() {
            if (!this.currentVideoData) {
                throw new Error('Aucune vidéo disponible');
            }

            return new Promise((resolve, reject) => {
                const video = this.createVideoElement();
                video.src = this.currentVideoData;

                const handleCanPlay = () => {
                    video.removeEventListener('canplay', handleCanPlay);
                    
                    const canvas = this.createCanvas(video);
                    const stream = this.captureCanvasStream(canvas, video);
                    
                    this.activeStreams++;
                    this.setupStreamCleanup(stream, video);
                    
                    resolve(stream);
                };

                const handleError = (error) => {
                    video.removeEventListener('error', handleError);
                    console.error('[VirtualCamera] Erreur lors de la lecture de la vidéo:', error);
                    reject(error);
                };

                video.addEventListener('canplay', handleCanPlay);
                video.addEventListener('error', handleError);

                video.play().catch(error => {
                    console.warn('[VirtualCamera] Impossible de lancer la vidéo:', error);
                });
            });
        }

        createCanvas(video) {
            const canvas = document.createElement('canvas');
            const aspectRatio = video.videoWidth / video.videoHeight;
            
            canvas.width = CONFIG.CANVAS_WIDTH;
            canvas.height = CONFIG.CANVAS_HEIGHT;
            
            if (aspectRatio >= 1) {
                canvas.height = Math.round(canvas.width / aspectRatio);
            } else {
                canvas.width = Math.round(canvas.height * aspectRatio);
            }
            
            return canvas;
        }

        captureCanvasStream(canvas, video) {
            const ctx = canvas.getContext('2d');
            
            const draw = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                if (video.requestVideoFrameCallback) {
                    video.requestVideoFrameCallback(draw);
                } else {
                    requestAnimationFrame(draw);
                }
            };

            // Attache le handler play une seule fois
            if (!this.drawHandlerAttached) {
                video.addEventListener('play', draw);
                this.drawHandlerAttached = true;
            }

            // Lance la boucle si la vidéo est déjà en lecture
            if (!video.paused) {
                draw();
            }

            const stream = canvas.captureStream(CONFIG.FPS);
            
            // Supprime les pistes audio
            stream.getAudioTracks().forEach(track => stream.removeTrack(track));
            
            return stream;
        }

        setupStreamCleanup(stream, video) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.addEventListener('ended', () => {
                    this.activeStreams--;
                    if (this.activeStreams <= 0 && video) {
                        video.pause();
                    }
                });
            }
        }

        // Méthodes de contrôle vidéo
        play() {
            this.videoElement?.play();
        }

        pause() {
            this.videoElement?.pause();
        }

        seek(time) {
            if (this.videoElement && typeof time === 'number') {
                this.videoElement.currentTime = time;
            }
        }
    }

    // === Message Handler ===
    class MessageHandler {
        constructor(videoManager) {
            this.videoManager = videoManager;
            this.channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
            this.lastSeekTime = 0;
            this.setupMessageListener();
        }

        setupMessageListener() {
            this.channel.addEventListener('message', async (event) => {
                // console.log('[VirtualCamera] Message reçu:', event.data);
                
                if (!event.data?.command) return;

                // Initialise la vidéo si nécessaire pour certaines commandes
                const needsVideo = ['play', 'pause', 'seek', 'sync', 'sourceChanged'];
                if (needsVideo.includes(event.data.command) && !this.videoManager.videoElement) {
                    this.videoManager.createVideoElement();
                }

                await this.handleCommand(event.data);
            });
        }

        async handleCommand(data) {
            switch (data.command) {
                case 'play':
                    this.videoManager.play();
                    break;
                case 'pause':
                    this.videoManager.pause();
                    break;
                case 'seek':
                    // Évite les seek trop fréquents
                    const now = Date.now();
                    if (now - this.lastSeekTime > 100) { // Limite à 10 fois par seconde max
                        this.videoManager.seek(data.time);
                        this.lastSeekTime = now;
                    }
                    break;
                case 'sourceChanged':
                    await this.videoManager.reloadVideo();
                    break;
                case 'turnOn':
                case 'turnOff':
                    // Ces commandes peuvent être utiles pour des actions spécifiques
                    console.log(`[VirtualCamera] Caméra virtuelle ${data.command === 'turnOn' ? 'activée' : 'désactivée'}`);
                    break;
                case 'sync':
                    if (typeof data.time === 'number') {
                        this.videoManager.seek(data.time);
                    }
                    break;
                default:
                    console.warn('[VirtualCamera] Commande inconnue:', data.command);
            }
        }

        destroy() {
            this.channel.close();
        }
    }

    // === Main Application ===
    class VirtualCameraApp {
        constructor() {
            this.videoManager = new VirtualVideoManager();
            this.messageHandler = null;
            this.originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        }

        async initialize() {
            try {
                await this.videoManager.initialize();
                this.messageHandler = new MessageHandler(this.videoManager);
                this.overrideGetUserMedia();
                
                console.log('[VirtualCamera] Application initialisée');
            } catch (error) {
                console.error('[VirtualCamera] Erreur lors de l\'initialisation:', error);
            }
        }

        overrideGetUserMedia() {
            navigator.mediaDevices.getUserMedia = async (constraints) => {
                const isOn = await DatabaseManager.getState();
                
                if (constraints?.video && isOn) {
                    await this.videoManager.checkForVideoUpdate();
                    return this.videoManager.createVirtualStream();
                }
                
                return this.originalGetUserMedia(constraints);
            };
        }
    }

    // === Initialisation ===
    const app = new VirtualCameraApp();
    await app.initialize();

})();