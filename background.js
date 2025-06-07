chrome.runtime.onInstalled.addListener(() => {
    console.log('Virtual Camera for Chrome extension installed.');
});

function applyProxySettings(proxySettings) {
    if (proxySettings && proxySettings.enabled) {
        const config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: proxySettings.type,
                    host: proxySettings.host,
                    port: parseInt(proxySettings.port, 10)
                },
                bypassList: ["<local>"]
            }
        };
        chrome.proxy.settings.set(
            { value: config, scope: 'regular' },
            () => console.log('[Proxy] Proxy applied:', config)
        );
    } else {
        chrome.proxy.settings.clear({ scope: 'regular' }, () => {
            console.log('[Proxy] Proxy disabled');
        });
    }
}

// Au démarrage, applique le proxy si activé
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('proxySettings', (data) => {
        applyProxySettings(data.proxySettings);
    });
});

// Il ne reste que le handler pour le clic sur l'icône de l'extension
chrome.action.onClicked.addListener((tab) => {
    try {
        const url = new URL(tab.url);
        // Crée une URL sur le même domaine
        const popupUrl = `${url.origin}/virtual-camera-interface`;
        chrome.windows.create({
            url: popupUrl,
            type: "popup",
            width: 600,
            height: 800
        });
    } catch (e) {
        // Si l'URL n'est pas valide (ex: chrome://), fallback sur un nouvel onglet
        chrome.tabs.create({ url: "https://example.com/virtual-camera-interface" });
    }
});

// Exemple d'écouteur pour appliquer le proxy à la volée (optionnel)
chrome.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changes detected:', changes);
    if (area === 'local' && changes.proxySettings) {
        applyProxySettings(changes.proxySettings.newValue);
    }
});

// chrome.webRequest.onAuthRequired.addListener(
//     function(details, callback) {
//         chrome.storage.local.get('proxySettings', (data) => {
//             const proxySettings = data.proxySettings || {};
//             if (
//                 proxySettings.enabled &&
//                 proxySettings.username &&
//                 proxySettings.password
//             ) {
//                 callback({
//                     authCredentials: {
//                         username: proxySettings.username,
//                         password: proxySettings.password
//                     }
//                 });
//             } else {
//                 callback({});
//             }
//         });
//     },
//     {urls: ["<all_urls>"]},
//     ["asyncBlocking"]
// );