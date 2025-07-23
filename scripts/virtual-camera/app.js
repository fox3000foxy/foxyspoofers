import { VirtualVideoManager } from './video-manager.js';
import { MessageHandler } from './message-handler.js';
import { DatabaseManager } from './database.js';

export class VirtualCameraApp {
    constructor() {
        this.videoManager = new VirtualVideoManager();
        this.messageHandler = null;
        this.originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        this.VIRTUAL_CAMERA_ID = 'foxyspoofers-virtual-camera';
        // Patch enumerateDevices pour ajouter la caméra virtuelle
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
            navigator.mediaDevices.enumerateDevices = async () => {
                const devices = await originalEnumerateDevices();
                devices.push({
                    deviceId: this.VIRTUAL_CAMERA_ID,
                    kind: 'videoinput',
                    label: 'FoxySpoofers Virtual Camera',
                    groupId: devices.length > 0 ? devices[0].groupId : '',
                    toJSON() { return this; }
                });
                return devices;
            };
        }
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
            // Check for deviceId in constraints
            let deviceId = null;
            if (constraints?.video && typeof constraints.video === 'object' && constraints.video.deviceId) {
                if (typeof constraints.video.deviceId === 'string') {
                    deviceId = constraints.video.deviceId;
                } else if (Array.isArray(constraints.video.deviceId)) {
                    deviceId = constraints.video.deviceId.find(id => id === this.VIRTUAL_CAMERA_ID);
                }
            }
            const isOn = await DatabaseManager.getState();
            if (deviceId === this.VIRTUAL_CAMERA_ID && isOn) {
                await this.videoManager.checkForVideoUpdate();
                return this.videoManager.createVirtualStream();
            }
            return this.originalGetUserMedia(constraints);
        };
    }
}