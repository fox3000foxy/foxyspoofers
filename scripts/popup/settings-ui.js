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
    // User-Agent et paramètres navigateur
    initUA() {
        const uaForm = document.getElementById('browser-form');
        const uaString = document.getElementById('ua-string');
        const langString = document.getElementById('lang-string');
        const languagesString = document.getElementById('languages-string');
        const tzString = document.getElementById('tz-string');
        const tzOffset = document.getElementById('tz-offset');
        const screenRes = document.getElementById('screen-res');
        const colorDepth = document.getElementById('color-depth');
        const windowOuter = document.getElementById('window-outer');
        const plugins = document.getElementById('plugins');
        const mimeTypes = document.getElementById('mimetypes');
        const connectionType = document.getElementById('connection-type');
        const deviceMemory = document.getElementById('device-memory');
        const cpuThreads = document.getElementById('cpu-threads');
        const uaEnable = document.getElementById('browser-enable');
        const uaStatus = document.getElementById('browser-status');
        const uaClearBtn = document.getElementById('browser-clear-btn');

        // Charger les valeurs sauvegardées
        chrome.storage.local.get('uaSettings', (data) => {
            const val = data.uaSettings || {};
            uaString.value = val.ua || '';
            langString.value = val.language || '';
            languagesString.value = val.languages || '';
            tzString.value = val.timezone || '';
            tzOffset.value = val.tzOffset || '';
            screenRes.value = val.screenRes || '';
            colorDepth.value = val.colorDepth || '';
            windowOuter.value = val.outer || '';
            plugins.value = val.plugins || '';
            mimeTypes.value = val.mimeTypes || '';
            connectionType.value = val.connection || '';
            deviceMemory.value = val.deviceMemory || '';
            cpuThreads.value = val.cpuThreads || '';
            if (uaEnable) uaEnable.classList.toggle('active', !!val.enabled);
        });

        function saveUASettings() {
            try {
                chrome.storage.local.set({
                    uaSettings: {
                        ua: uaString.value || uaString.placeholder,
                        language: langString.value || langString.placeholder,
                        languages: languagesString.value || languagesString.placeholder,
                        timezone: tzString.value || tzString.placeholder,
                        tzOffset: tzOffset.value || tzOffset.placeholder,
                        screenRes: screenRes.value || screenRes.placeholder,
                        colorDepth: colorDepth.value || colorDepth.placeholder,
                        outer: windowOuter.value || windowOuter.placeholder,
                        plugins: plugins.value || plugins.placeholder,
                        mimeTypes: mimeTypes.value || mimeTypes.placeholder,
                        connection: connectionType.value || connectionType.placeholder,
                        deviceMemory: deviceMemory.value || deviceMemory.placeholder,
                        cpuThreads: cpuThreads.value || cpuThreads.placeholder,
                        enabled: uaEnable && uaEnable.classList.contains('active')
                    }
                }, () => {
                    if (uaStatus) {
                        uaStatus.textContent = "Browser settings saved!";
                        setTimeout(() => uaStatus.textContent = "", 2000);
                    }
                    if (this.refreshStatus) this.refreshStatus();
                });
            } catch {}
        }

        if (uaForm) {
            [uaString, langString, languagesString, tzString, tzOffset, screenRes, colorDepth, windowOuter, plugins, mimeTypes, connectionType, deviceMemory, cpuThreads].forEach(el => {
                if (el) el.addEventListener('input', saveUASettings.bind(this));
            });
            if (uaEnable) uaEnable.addEventListener('click', () => {
                uaEnable.classList.toggle('active');
                saveUASettings.call(this);
            });
        }
        if (uaClearBtn) {
            uaClearBtn.addEventListener('click', () => {
                chrome.storage.local.remove('uaSettings', () => {
                    [uaString, langString, languagesString, tzString, tzOffset, screenRes, colorDepth, windowOuter, plugins, mimeTypes, connectionType, deviceMemory, cpuThreads].forEach(el => {
                        if (el) el.value = '';
                    });
                    if (uaEnable) uaEnable.classList.remove('active');
                    if (uaStatus) {
                        uaStatus.textContent = "Browser settings reset!";
                        setTimeout(() => uaStatus.textContent = "", 2000);
                    }
                    if (this.refreshStatus) this.refreshStatus();
                });
            });
        }
    }
}
window.SettingsUI = SettingsUI;