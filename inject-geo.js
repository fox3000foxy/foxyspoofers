(async function() {
    // Évite l'injection multiple
    if (window.virtualGeoInjected) return;
    window.virtualGeoInjected = true;

    console.log('Geo Spoofing injected');

    // Ouvre la DB et récupère les settings
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('virtualCameraDB', 2);
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
            };
            request.onsuccess = function(event) { resolve(event.target.result); };
            request.onerror = function(event) { reject(event.target.error); };
        });
    }

    async function getGeoSpoofSettings() {
        const db = await openDB();
        return new Promise(resolve => {
            const store = db.transaction(['state'], 'readonly').objectStore('state');
            const req = store.get('geoSpoof');
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = () => resolve(null);
        });
    }

    // Override geolocation API
    const origGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    const origWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);

    function spoofedPosition(success, error, options, lat, lon) {
        success({
            coords: {
                latitude: lat,
                longitude: lon,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        });
    }

    async function overrideGeo() {
        // console.log('Overriding geolocation API');
        const settings = await getGeoSpoofSettings();
        // console.log('Geo spoof settings loaded:', settings);
        if (!settings || !settings.enabled) return;
        console.log('Geo spoofing enabled:', settings.lat, settings.lon);
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
            console.log('Spoofing geolocation:', settings.lat, settings.lon);
            spoofedPosition(success, error, options, settings.lat, settings.lon);
        };
        navigator.geolocation.watchPosition = function(success, error, options) {
            const id = setInterval(() => {
                spoofedPosition(success, error, options, settings.lat, settings.lon);
            }, 1000);
            return id;
        };
    }

    // Applique l'override au chargement et sur changement de settings
    overrideGeo();
    // window.addEventListener('focus', overrideGeo);
    console.log('Geo Spoofing content script injected');

    // Optionnel: écoute les changements de settings via BroadcastChannel
    const geoChannel = new BroadcastChannel('virtual_geo_channel');
    geoChannel.addEventListener('message', overrideGeo);

})();