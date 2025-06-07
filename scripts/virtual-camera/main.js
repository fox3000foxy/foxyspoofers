import { VirtualCameraApp } from './app.js';

(async function() {
    'use strict';
    if (window.virtualCameraInjected) return;
    window.virtualCameraInjected = true;

    if (window.location.href.includes('foxyspoofers')) {
        console.log('[VirtualCamera] Interface détectée, injection annulée.');
        return;
    }

    const app = new VirtualCameraApp();
    await app.initialize();
})();