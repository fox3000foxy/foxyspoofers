class ProxyManager {
    static apply(settings) {
        if (settings && settings.enabled) {
            const config = {
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: settings.type,
                        host: settings.host,
                        port: parseInt(settings.port, 10)
                    },
                    bypassList: ["<local>"]
                }
            };
            chrome.proxy.settings.set({ value: config, scope: 'regular' });
        } else {
            chrome.proxy.settings.clear({ scope: 'regular' });
        }
    }
}