export class NavSpoofSettings {
    static async fetch() {
        // Si on est dans l'extension, on lit depuis chrome.storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise(resolve => {
                chrome.storage.local.get('uaSettings', (data) => {
                    resolve(data.uaSettings || null);
                });
            });
        }

        // Sinon, on lit depuis les balises meta
        const fields = [
            { key: 'ua', name: 'foxyspoofers-user-agent' },
            { key: 'language', name: 'foxyspoofers-language' },
            { key: 'languages', name: 'foxyspoofers-languages' },
            // { key: 'timezone', name: 'foxyspoofers-timezone' },
            // { key: 'tzOffset', name: 'foxyspoofers-tz-offset' },
            { key: 'screenRes', name: 'foxyspoofers-screen-res' },
            // { key: 'colorDepth', name: 'foxyspoofers-color-depth' },
            // { key: 'outer', name: 'foxyspoofers-window-outer' },
            // { key: 'plugins', name: 'foxyspoofers-plugins' },
            // { key: 'mimeTypes', name: 'foxyspoofers-mimetypes' },
            // { key: 'connection', name: 'foxyspoofers-connection' },
            { key: 'deviceMemory', name: 'foxyspoofers-device-memory' },
            { key: 'cpuThreads', name: 'foxyspoofers-cpu-threads' },
            { key: 'enabled', name: 'foxyspoofers-enabled' }
        ];
        const result = {};
        fields.forEach(f => {
            const meta = document.querySelector(`meta[name="${f.name}"]`);
            if (meta && meta.content) {
                result[f.key] = meta.content;
            }
        });
        return Object.keys(result).length > 0 ? result : null;
    }
}