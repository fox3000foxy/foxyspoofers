export class GeoSpoofSettings {
    static async fetch() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise(resolve => {
                chrome.storage.local.get('geoSpoof', (data) => {
                    resolve(data.geoSpoof || null);
                });
            });
        }
        const geoTag = document.querySelector('meta[name="geo.position"]');
        if (geoTag) {
            try {
                const json = geoTag.getAttribute('value') || geoTag.content;
                if (json) {
                    return JSON.parse(json);
                }
            } catch (e) {
                console.log('%c[Error]%c Failed to parse geo.position JSON:', 'color: red; font-weight: bold;', '', e);
            }
        }
        return null;
    }
}