import { GeoSpoofer } from './geo-spoofer.js';

(async function() {
    if(location.href.includes('foxyspoofers')) {
        console.log('[Geo] Interface détectée, injection annulée.');
        return;
    }
    if (window.virtualGeoInjected) return;
    window.virtualGeoInjected = true;

    const spoofer = new GeoSpoofer();
    await spoofer.override();

    const geoChannel = new BroadcastChannel('virtual_geo_channel');
    geoChannel.addEventListener('message', () => spoofer.override());
})();