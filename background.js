import { ProxyManager } from './scripts/proxy/proxy-manager.js';
import { UserAgentManager } from './scripts/user-agent/user-agent-manager.js';

class ExtensionController {
    static initialize() {
        chrome.runtime.onInstalled.addListener(() => {
            this.applySettings();
        });

        chrome.runtime.onStartup.addListener(() => {
            this.applySettings();
        });

        chrome.action.onClicked.addListener((tab) => {
            try {
                const url = new URL(tab.url);
                const popupUrl = `${url.origin}/foxyspoofers`;
                chrome.windows.create({
                    url: popupUrl,
                    type: "popup",
                    width: 600,
                    height: 800
                });
            } catch (error) {
                const errorHtml = encodeURIComponent(`
                    <html>
                    <body style="font-family:sans-serif;padding:20px;">
                        <h2>Erreur d'ouverture</h2>
                        <p>Impossible d'ouvrir la fenêtre pour cette page.</p>
                        <pre>${error.message}</pre>
                    </body>
                    </html>
                `);
                chrome.windows.create({
                    url: "data:text/html," + errorHtml,
                    type: "popup",
                    width: 400,
                    height: 250
                });
            }
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                if (changes.proxySettings) {
                    ProxyManager.apply(changes.proxySettings.newValue);
                }
                if (changes.uaSettings) {
                    UserAgentManager.apply(changes.uaSettings.newValue);
                }
            }
        });
    }

    static applySettings() {
        chrome.storage.local.get(['proxySettings', 'uaSettings'], (data) => {
            ProxyManager.apply(data.proxySettings);
            UserAgentManager.apply(data.uaSettings);
        });
    }
}

ExtensionController.initialize();