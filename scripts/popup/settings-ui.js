class SettingsUI {
    constructor(refreshStatusCb) {
        this.refreshStatus = refreshStatusCb;
        this.initGeo();
        this.initProxy();
        this.initUA();
    }
    // Geolocation
    initGeo() {
        const geoForm = document.getElementById('geo-form');
        const geoLat = document.getElementById('geo-lat');
        const geoLon = document.getElementById('geo-lon');
        const geoEnable = document.getElementById('geo-enable');
        const geoStatus = document.getElementById('geo-status');
        chrome.storage.local.get('geoSpoof', (data) => {
            const val = data.geoSpoof || {};
            if (typeof val.lat !== "undefined") geoLat.value = val.lat;
            if (typeof val.lon !== "undefined") geoLon.value = val.lon;
            geoEnable.classList.toggle('active', !!val.enabled);
        });
        function saveGeoSettings() {
            chrome.storage.local.set({ geoSpoof: { 
                lat: Number(geoLat.value), 
                lon: Number(geoLon.value), 
                enabled: geoEnable.classList.contains('active') 
            } }, () => {
                geoStatus.textContent = "Settings saved!";
                setTimeout(() => geoStatus.textContent = "", 2000);
                if (this.refreshStatus) this.refreshStatus();
            });
        }
        if (geoForm) {
            geoLat.addEventListener('input', saveGeoSettings.bind(this));
            geoLon.addEventListener('input', saveGeoSettings.bind(this));
            geoEnable.addEventListener('click', () => {
                geoEnable.classList.toggle('active');
                saveGeoSettings.call(this);
            });
        }
    }
    // Proxy
    initProxy() {
        const proxyForm = document.getElementById('proxy-form');
        const proxyType = document.getElementById('proxy-type');
        const proxyHost = document.getElementById('proxy-host');
        const proxyPort = document.getElementById('proxy-port');
        const proxyEnable = document.getElementById('proxy-enable');
        const proxyStatus = document.getElementById('proxy-status');
        const proxyClearBtn = document.getElementById('proxy-clear-btn');
        chrome.storage.local.get('proxySettings', (data) => {
            const val = data.proxySettings || {};
            proxyType.value = val.type || 'http';
            proxyHost.value = val.host || '';
            proxyPort.value = val.port || '';
            proxyEnable.classList.toggle('active', !!val.enabled);
        });
        function saveProxySettings() {
            chrome.storage.local.set({
                proxySettings: { 
                    type: proxyType.value, 
                    host: proxyHost.value, 
                    port: proxyPort.value, 
                    enabled: proxyEnable.classList.contains('active') 
                }
            }, () => {
                proxyStatus.textContent = "Proxy settings saved!";
                setTimeout(() => proxyStatus.textContent = "", 2000);
                if (this.refreshStatus) this.refreshStatus();
            });
        }
        if (proxyForm) {
            proxyType.addEventListener('change', saveProxySettings.bind(this));
            proxyHost.addEventListener('input', saveProxySettings.bind(this));
            proxyPort.addEventListener('input', saveProxySettings.bind(this));
            proxyEnable.addEventListener('click', () => {
                proxyEnable.classList.toggle('active');
                saveProxySettings.call(this);
            });
        }
        if (proxyClearBtn) {
            proxyClearBtn.addEventListener('click', () => {
                chrome.storage.local.remove('proxySettings', () => {
                    proxyType.value = 'http';
                    proxyHost.value = '';
                    proxyPort.value = '';
                    proxyEnable.classList.remove('active');
                    proxyStatus.textContent = "Proxy settings cleared!";
                    setTimeout(() => proxyStatus.textContent = "", 2000);
                    if (this.refreshStatus) this.refreshStatus();
                });
            });
        }
    }
    // User-Agent
    initUA() {
        const uaForm = document.getElementById('ua-form');
        const uaString = document.getElementById('ua-string');
        const uaEnable = document.getElementById('ua-enable');
        const uaStatus = document.getElementById('ua-status');
        const uaClearBtn = document.getElementById('ua-clear-btn');
        chrome.storage.local.get('uaSettings', (data) => {
            const val = data.uaSettings || {};
            uaString.value = val.ua || '';
            uaEnable.classList.toggle('active', !!val.enabled);
        });
        function saveUASettings() {
            try {
                chrome.storage.local.set({
                    uaSettings: { ua: uaString.value, enabled: uaEnable.classList.contains('active') }
                }, () => {
                    uaStatus.textContent = "User-Agent settings saved!";
                    setTimeout(() => uaStatus.textContent = "", 2000);
                    if (this.refreshStatus) this.refreshStatus();
                });
            } catch {}
        }
        if (uaForm) {
            uaString.addEventListener('input', saveUASettings.bind(this));
            uaEnable.addEventListener('click', () => {
                uaEnable.classList.toggle('active');
                saveUASettings.call(this);
            });
        }
        if (uaClearBtn) {
            uaClearBtn.addEventListener('click', () => {
                chrome.storage.local.remove('uaSettings', () => {
                    uaString.value = '';
                    uaEnable.classList.remove('active');
                    uaStatus.textContent = "User-Agent cleared!";
                    setTimeout(() => uaStatus.textContent = "", 2000);
                    if (this.refreshStatus) this.refreshStatus();
                });
            });
        }
    }
}
window.SettingsUI = SettingsUI;