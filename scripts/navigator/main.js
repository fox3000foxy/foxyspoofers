import { NavSpoofers } from './nav-spoofers.js';

(async function() {
    if(location.href.includes('foxyspoofers')) {
        console.log('[Nav] Interface détectée, injection annulée.');
        return;
    }
    if (window.virtualNavInjected) return;
    window.virtualNavInjected = true;

    const spoofer = new NavSpoofers();
    await spoofer.override();

    const geoChannel = new BroadcastChannel('virtual_nav_channel');
    geoChannel.addEventListener('message', () => spoofer.override());
})();