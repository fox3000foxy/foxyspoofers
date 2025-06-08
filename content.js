class ScriptInjector {
    static name = 'ScriptInjector';
    static inject() {
        // Injection séquentielle pour garantir l'ordre
        if(location.href.includes('foxyspoofers')) {
            this.injectScript('scripts/leaflet/leaflet.js', false, () => {
                this.injectScript('scripts/leaflet/Control.Geocoder.js', false, () => {
                    this.injectScript('scripts/leaflet/main.js', false);
                });
            });
        }
        // Les autres scripts peuvent rester en parallèle
        this.injectScript('scripts/virtual-camera/main.js', true);
        this.injectScript('scripts/geo/main.js', true);
        this.injectScript('scripts/navigator/main.js', true);
    }
    static injectScript(file, es6 = false, onload) {
        const script = document.createElement('script');
        if (es6) script.type = 'module';
        script.src = chrome.runtime.getURL(file);
        if (onload) script.onload = onload;
        (document.head || document.documentElement).appendChild(script);
    }
}

class GeoMetaManager {
    static name = 'GeoMetaManager';
    static inject() {
        const metaGeo = document.createElement('meta');
        metaGeo.name = 'foxyspoofers-geo-position';
        chrome.storage.local.get('geoSpoof', (data) => {
            const coords = JSON.stringify(data.geoSpoof) || '48.858844;2.294351';
            metaGeo.content = coords;
            document.head.appendChild(metaGeo);
        });
    }
}

class UserAgentManager {
    static name = 'UserAgentManager';
    static inject() {
        chrome.storage.local.get(['uaSettings'], (data) => {
            const s = data.uaSettings || {};
            if (!s.enabled) return;

            // Pour chaque champ, injecte une balise meta
            const fields = [
                { key: 'ua', name: 'foxyspoofers-user-agent' },
                { key: 'language', name: 'foxyspoofers-language' },
                { key: 'languages', name: 'foxyspoofers-languages' },
                { key: 'timezone', name: 'foxyspoofers-timezone' },
                { key: 'tzOffset', name: 'foxyspoofers-tz-offset' },
                { key: 'screenRes', name: 'foxyspoofers-screen-res' },
                { key: 'colorDepth', name: 'foxyspoofers-color-depth' },
                { key: 'outer', name: 'foxyspoofers-window-outer' },
                { key: 'plugins', name: 'foxyspoofers-plugins' },
                { key: 'mimeTypes', name: 'foxyspoofers-mimetypes' },
                { key: 'connection', name: 'foxyspoofers-connection' },
                { key: 'deviceMemory', name: 'foxyspoofers-device-memory' },
                { key: 'cpuThreads', name: 'foxyspoofers-cpu-threads' },
                { key: 'enabled', name: 'foxyspoofers-enabled' }
            ];
            fields.forEach(f => {
                if (s[f.key]) {
                    const meta = document.createElement('meta');
                    meta.name = f.name;
                    meta.content = s[f.key];
                    document.head.appendChild(meta);
                }
            });
        });
    }
}

// Injection centralisée
ScriptInjector.inject();
GeoMetaManager.inject();
UserAgentManager.inject();