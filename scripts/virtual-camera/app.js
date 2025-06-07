import { VirtualVideoManager } from './video-manager.js';
import { MessageHandler } from './message-handler.js';
import { DatabaseManager } from './database.js';

export class VirtualCameraApp {
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
            console.log('%c[Error]%c [VirtualCamera] Erreur lors de l\'initialisation:', 'color: red; font-weight: bold;', '', error);
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