import { CONFIG } from './config.js';
import { DatabaseManager } from './database.js';

export class VirtualVideoManager {
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
            console.log('%c[Warning]%c [VirtualCamera] Aucune vidéo trouvée dans IndexedDB.', 'color:orange;font-weight:bold', '');
        }
    }

    createVideoElement() {
        if (this.videoElement) return this.videoElement;
        const video = document.createElement('video');
        Object.assign(video, {
            loop: true,
            muted: true,
            volume: 0,
            autoplay: true,
            playsInline: true
        });
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
            console.log('%c[Warning]%c [VirtualCamera] Impossible de lancer la vidéo:', 'color:orange;font-weight:bold', '', error);
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
        if (!this.currentVideoData) throw new Error('Aucune vidéo disponible');
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
                console.log('%c[Error]%c [VirtualCamera] Erreur lors de la lecture de la vidéo:', 'color: red; font-weight: bold;', '', error);
                reject(error);
            };
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);
            video.play().catch(error => {
                console.log('%c[Warning]%c [VirtualCamera] Impossible de lancer la vidéo:', 'color:orange;font-weight:bold', '', error);
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
            // Met à jour l'aspect ratio à chaque frame
            const aspectRatio = video.videoWidth / video.videoHeight;
            if (aspectRatio >= 1) {
                canvas.width = CONFIG.CANVAS_WIDTH;
                canvas.height = Math.round(canvas.width / aspectRatio);
            } else {
                canvas.height = CONFIG.CANVAS_HEIGHT;
                canvas.width = Math.round(canvas.height * aspectRatio);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (video.requestVideoFrameCallback) {
                video.requestVideoFrameCallback(draw);
            } else {
                requestAnimationFrame(draw);
            }
        };
        if (!this.drawHandlerAttached) {
            video.addEventListener('play', draw);
            this.drawHandlerAttached = true;
        }
        if (!video.paused) draw();
        const stream = canvas.captureStream(CONFIG.FPS);
        stream.getAudioTracks().forEach(track => stream.removeTrack(track));
        return stream;
    }

    setupStreamCleanup(stream, video) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.addEventListener('ended', () => {
                this.activeStreams--;
                if (this.activeStreams <= 0 && video) video.pause();
            });
        }
    }

    play() { this.videoElement?.play(); }
    pause() { this.videoElement?.pause(); }
    seek(time) {
        if (this.videoElement && typeof time === 'number') {
            this.videoElement.currentTime = time;
        }
    }
}