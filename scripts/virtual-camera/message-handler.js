import { CONFIG } from './config.js';

export class MessageHandler {
    constructor(videoManager) {
        this.videoManager = videoManager;
        this.channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
        this.lastSeekTime = 0;
        this.setupMessageListener();
    }

    setupMessageListener() {
        this.channel.addEventListener('message', async (event) => {
            if (!event.data?.command) return;
            const needsVideo = ['play', 'pause', 'seek', 'sync', 'sourceChanged'];
            if (needsVideo.includes(event.data.command) && !this.videoManager.videoElement) {
                this.videoManager.createVideoElement();
            }
            await this.handleCommand(event.data);
        });
    }

    async handleCommand(data) {
        switch (data.command) {
            case 'play': this.videoManager.play(); break;
            case 'pause': this.videoManager.pause(); break;
            case 'seek':
                const now = Date.now();
                if (now - this.lastSeekTime > 100) {
                    this.videoManager.seek(data.time);
                    this.lastSeekTime = now;
                }
                break;
            case 'sourceChanged':
                await this.videoManager.reloadVideo();
                break;
            case 'turnOn':
            case 'turnOff':
                console.log(`[VirtualCamera] Caméra virtuelle ${data.command === 'turnOn' ? 'activée' : 'désactivée'}`);
                break;
            case 'sync':
                if (typeof data.time === 'number') this.videoManager.seek(data.time);
                break;
            default:
                console.log('%c[Warning]%c [VirtualCamera] Commande inconnue:', 'color:orange;font-weight:bold', '', data.command);
        }
    }

    destroy() { this.channel.close(); }
}