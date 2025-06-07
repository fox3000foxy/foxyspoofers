class ScriptInjector {
    static name = 'ScriptInjector';
    static inject() {
        this.injectScript('scripts/virtual-camera');
        this.injectScript('scripts/geo');
    }
    static injectScript(file) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = chrome.runtime.getURL(file + '/main.js');
        (document.head || document.documentElement).appendChild(script);
    }
}

class GeoMetaManager {
    static name = 'GeoMetaManager';
    static inject() {
        const metaGeo = document.createElement('meta');
        metaGeo.name = 'geo.position';
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
            const ua = data.uaSettings?.ua;
            if (!ua) return;
            try {
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => ua,
                    configurable: true
                });
                window.navigator.__defineGetter__('userAgent', function() {
                    return ua;
                });
            } catch (e) {
                console.log('%c[Warning]%c [VirtualCamera] Impossible de redéfinir navigator.userAgent:', 'color:orange;font-weight:bold', '', e);
            }
        });
    }
}

// Injection centralisée
ScriptInjector.inject();
GeoMetaManager.inject();
UserAgentManager.inject();